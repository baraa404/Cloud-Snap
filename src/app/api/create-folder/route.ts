import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const runtime = "edge";

export async function POST(request: NextRequest) {
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

        // Create a placeholder file to ensure the folder exists in GitHub
        const placeholderPath = `${cleanPath}/.gitkeep`;
        const content = Buffer.from('\n').toString('base64');

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: placeholderPath,
            message: `Create folder: ${cleanPath}`,
            content,
            branch,
        });

        return NextResponse.json({
            success: true,
            path: cleanPath,
        });
    } catch (error) {
        console.error('Create folder error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: `Failed to create folder: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create folder' },
            { status: 500 }
        );
    }
}