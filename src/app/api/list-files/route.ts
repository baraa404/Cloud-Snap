import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const runtime = "edge";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path') || '';

        const owner = process.env.GITHUB_OWNER!;
        const repo = process.env.GITHUB_REPO!;
        const branch = process.env.GITHUB_BRANCH || 'main';

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        // Get contents of the specified path
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });

        // Helper to get commit SHA for a file
        async function getCommitSha(filePath: string): Promise<string | null> {
            try {
                const commitResp = await octokit.repos.listCommits({
                    owner,
                    repo,
                    path: filePath,
                    per_page: 1,
                });
                return commitResp.data[0]?.sha || null;
            } catch {
                return null;
            }
        }

        if (Array.isArray(response.data)) {
            // Only fetch commit SHAs for files (not folders)
            const items = await Promise.all(response.data.map(async item => {
                if (item.type === 'file') {
                    const commitSha = await getCommitSha(item.path);
                    return {
                        name: item.name,
                        path: item.path,
                        type: item.type,
                        size: item.size,
                        sha: item.sha,
                        download_url: item.download_url,
                        html_url: item.html_url,
                        commit_sha: commitSha,
                        jsdelivr_url: commitSha ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${commitSha}/${item.path}` : '',
                        raw_url: commitSha ? `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${item.path}` : '',
                    };
                } else {
                    return {
                        name: item.name,
                        path: item.path,
                        type: item.type,
                        size: item.size,
                        sha: item.sha,
                        download_url: item.download_url,
                        html_url: item.html_url,
                    };
                }
            }));
            return NextResponse.json({
                success: true,
                items,
                path,
            });
        } else {
            let commitSha = null;
            if (response.data.type === 'file') {
                commitSha = await getCommitSha(response.data.path);
            }
            return NextResponse.json({
                success: true,
                items: [{
                    name: response.data.name,
                    path: response.data.path,
                    type: response.data.type,
                    size: response.data.size,
                    sha: response.data.sha,
                    download_url: response.data.download_url,
                    html_url: response.data.html_url,
                    commit_sha: commitSha,
                    jsdelivr_url: commitSha ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${commitSha}/${response.data.path}` : '',
                    raw_url: commitSha ? `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${response.data.path}` : '',
                }],
                path,
            });
        }
    } catch (error) {
        console.error('List files error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: `Failed to list files: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to list files' },
            { status: 500 }
        );
    }
}
