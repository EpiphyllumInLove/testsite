/**
 * 反馈提交 API
 *
 * Token 通过 Cloudflare Pages 构建变量注入：
 * 在 Cloudflare Dashboard 设置构建变量 GITHUB_TOKEN，
 * 构建命令会替换占位符 __GITHUB_TOKEN__ 为真实 Token。
 */

const GITHUB_CONFIG = {
    owner: 'EpiphyllumInLove',
    repo: 'testsite',
    token: '__GITHUB_TOKEN__'
};

class FeedbackAPI {
    constructor() {
        this.owner = GITHUB_CONFIG.owner;
        this.repo = GITHUB_CONFIG.repo;
        this.token = GITHUB_CONFIG.token;
    }

    isConfigured() {
        return !!(this.owner && this.repo && this.token && this.token !== '__GITHUB_TOKEN__');
    }

    async submitFeedback(formData) {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: '网站管理员还未配置 GitHub Token，请通过 GitHub Issues 页面直接提交。'
            };
        }

        const issueTitle = `[反馈] ${formData.type} - ${formData.title}`;
        const issueBody = [
            `## 反馈类型`,
            formData.type,
            ``,
            `## 反馈标题`,
            formData.title,
            ``,
            `## 反馈内容`,
            formData.content,
            ``,
            `---`,
            `**联系方式**: ${formData.contact || '未提供'}`,
            `**提交时间**: ${formData.timestamp}`,
            `**来源**: 网站反馈表单`
        ].join('\n');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.owner}/${this.repo}/issues`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        title: issueTitle,
                        body: issueBody,
                        labels: ['feedback', formData.type]
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            return { success: true };
        } catch (e) {
            console.error('GitHub API 错误:', e);
            return {
                success: false,
                error: e.message || '提交失败，请稍后重试。'
            };
        }
    }

    getIssuesUrl() {
        if (this.owner && this.repo) {
            return `https://github.com/${this.owner}/${this.repo}/issues`;
        }
        return null;
    }
}

const API = new FeedbackAPI();
