const GITHUB_CONFIG = {
    owner: 'EpiphyllumInLove',
    repo: 'testsite'
};

class FeedbackAPI {
    constructor() {
        this.owner = GITHUB_CONFIG.owner;
        this.repo = GITHUB_CONFIG.repo;
    }

    isConfigured() {
        return !!(this.owner && this.repo);
    }

    /**
     * 提交反馈 - 调用 Cloudflare Pages Function 代理
     */
    async submitFeedback(formData) {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: '网站管理员还未配置仓库信息。'
            };
        }

        try {
            const response = await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    owner: this.owner,
                    repo: this.repo,
                    ...formData
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return { success: true };
        } catch (e) {
            console.error('提交失败:', e);
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
