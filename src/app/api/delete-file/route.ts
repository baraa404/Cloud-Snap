import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const runtime = "edge";

export async function DELETE(request: NextRequest) {
    try {
        const { path, sha } = await request.json();

        if (!path || !sha) {
            return NextResponse.json(
                { error: 'Path and SHA are required' },
                { status: 400 }
            );
        }

        const owner = process.env.GITHUB_OWNER!;
        const repo = process.env.GITHUB_REPO!;
        const branch = process.env.GITHUB_BRANCH || 'main';

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        const realPath = `src/assets/${path}`;

        // Delete the file from GitHub
        await octokit.repos.deleteFile({
            owner,
            repo,
            path: realPath,
            message: `Delete file: ${realPath}`,
            sha,
            branch,
        });

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete file error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: `Failed to delete file: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}
