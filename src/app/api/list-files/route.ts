import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const runtime = "edge";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reqPath = searchParams.get('path') || '';
        const path = reqPath ? `src/assets/${reqPath}` : 'src/assets';

        const owner = process.env.GITHUB_OWNER!;
        const repo = process.env.GITHUB_REPO!;
        const branch = process.env.GITHUB_BRANCH || 'main';

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        let response;
        try {
            // Get contents of the specified path
            response = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref: branch,
            });
        } catch (error) {
            const err = error as Error & { status?: number };
            if (err.status === 404) {
                return NextResponse.json({ success: true, items: [], path: reqPath });
            }
            throw error;
        }

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
                const cleanPath = item.path.replace(/^src\/assets\//, '');
                if (item.type === 'file') {
                    const commitSha = await getCommitSha(item.path);
                    return {
                        name: item.name,
                        path: cleanPath,
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
                        path: cleanPath,
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
                path: reqPath,
            });
        } else {
            let commitSha = null;
            if (response.data.type === 'file') {
                commitSha = await getCommitSha(response.data.path);
            }
            const cleanPath = response.data.path.replace(/^src\/assets\//, '');
            return NextResponse.json({
                success: true,
                items: [{
                    name: response.data.name,
                    path: cleanPath,
                    type: response.data.type,
                    size: response.data.size,
                    sha: response.data.sha,
                    download_url: response.data.download_url,
                    html_url: response.data.html_url,
                    commit_sha: commitSha,
                    jsdelivr_url: commitSha ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${commitSha}/${response.data.path}` : '',
                    raw_url: commitSha ? `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${response.data.path}` : '',
                }],
                path: reqPath,
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
