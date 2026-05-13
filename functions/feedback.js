/**
 * Cloudflare Pages Function - 反馈提交代理
 *
 * 前端 POST /feedback 时触发，服务端使用环境变量中的 GITHUB_TOKEN
 * 向 GitHub API 创建 Issue。Token 不会暴露给浏览器。
 *
 * 环境变量（在 Cloudflare Dashboard 中设置）：
 *   GITHUB_TOKEN = 你的 Personal Access Token
 */

export async function onRequest(context) {
    // 允许跨域
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 预检请求
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: '仅支持 POST 请求' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await context.request.json();
        const { owner, repo, type, title, content, contact, timestamp } = body;

        // 从环境变量读取 Token（在 Cloudflare Dashboard 中设置）
        const token = context.env.GITHUB_TOKEN;

        if (!token) {
            return new Response(JSON.stringify({ error: '服务端未配置 GitHub Token，请联系管理员。' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!owner || !repo || !title || !content) {
            return new Response(JSON.stringify({ error: '缺少必要参数' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const issueTitle = `[反馈] ${type || '其他'} - ${title}`;
        const issueBody = [
            `## 反馈类型`,
            type || '未指定',
            ``,
            `## 反馈标题`,
            title,
            ``,
            `## 反馈内容`,
            content,
            ``,
            `---`,
            `**联系方式**: ${contact || '未提供'}`,
            `**提交时间**: ${timestamp || new Date().toISOString()}`,
            `**来源**: 网站反馈表单`
        ].join('\n');

        // 调用 GitHub API 创建 Issue
        const githubResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody,
                    labels: ['feedback', type || 'other']
                })
            }
        );

        if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            throw new Error(errorData.message || `GitHub API: ${githubResponse.status}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Pages Function 错误:', e);
        return new Response(JSON.stringify({ error: e.message || '服务器内部错误' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
