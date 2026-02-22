import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const runtime = "edge";

async function deletePath(octokit: Octokit, owner: string, repo: string, branch: string, path: string) {
    const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
    });

    if (Array.isArray(response.data)) {
        for (const item of response.data) {
            if (item.type === 'dir') {
                await deletePath(octokit, owner, repo, branch, item.path);
            } else {
                await octokit.repos.deleteFile({
                    owner,
                    repo,
                    path: item.path,
                    message: `Delete file: ${item.path}`,
                    sha: item.sha,
                    branch,
                });
            }
        }
    } else {
        await octokit.repos.deleteFile({
            owner,
            repo,
            path: response.data.path,
            message: `Delete file: ${response.data.path}`,
            sha: response.data.sha,
            branch,
        });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { path } = await request.json();

        if (!path || typeof path !== 'string') {
            return NextResponse.json(
                { error: 'Folder path is required' },
                { status: 400 }
            );
        }

        const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9_\/-]/g, '-');
        if (!cleanPath) {
            return NextResponse.json(
                { error: 'Invalid folder path' },
                { status: 400 }
            );
        }

        const owner = process.env.GITHUB_OWNER!;
        const repo = process.env.GITHUB_REPO!;
        const branch = process.env.GITHUB_BRANCH || 'main';

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        const realPath = `src/assets/${cleanPath}`;
        await deletePath(octokit, owner, repo, branch, realPath);

        return NextResponse.json({
            success: true,
            path: cleanPath,
        });
    } catch (error) {
        console.error('Delete folder error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: `Failed to delete folder: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete folder' },
            { status: 500 }
        );
    }
}