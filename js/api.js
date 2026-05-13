/**
 * GitHub API 操作工具
 * 用于将反馈提交到 GitHub Issues
 *
 * 配置方式（二选一）：
 * 1. 在浏览器控制台输入：API.saveConfig('你的用户名', '你的仓库名')
 * 2. 直接修改下方 CONFIG 中的 owner 和 repo（token 仍需控制台配置）
 */

const CONFIG = {
    owner: 'EpiphyllumInLove',
    repo: 'testsite',
};

class GitHubAPI {
    constructor() {
        this.owner = CONFIG.owner || '';
        this.repo = CONFIG.repo || '';
        this.token = '';
        this.initialized = false;
        this._loadFromStorage();
    }

    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('github_config');
            if (saved) {
                const config = JSON.parse(saved);
                this.owner = config.owner || this.owner;
                this.repo = config.repo || this.repo;
                this.token = config.token || '';
                this.initialized = !!(this.owner && this.repo && this.token);
            }
        } catch (e) { /* ignore */ }
    }

    /**
     * 提交反馈 - 创建 GitHub Issue
     */
    async submitFeedback(formData) {
        this._loadFromStorage();

        if (!this.initialized) {
            return {
                success: false,
                error: '请先配置 GitHub 信息',
                needConfig: true
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
                error: e.message || '提交失败，请检查 GitHub Token 是否有效'
            };
        }
    }

    /**
     * 保存 GitHub 配置到 localStorage
     * 在浏览器控制台调用：
     *   API.saveConfig('你的GitHub用户名', '你的仓库名', '你的PersonalAccessToken')
     */
    saveConfig(owner, repo, token) {
        this.owner = owner || this.owner;
        this.repo = repo || this.repo;
        this.token = token || this.token;
        this.initialized = !!(this.owner && this.repo && this.token);
        localStorage.setItem('github_config', JSON.stringify({
            owner: this.owner,
            repo: this.repo,
            token: this.token
        }));
    }

    /**
     * 检查是否已配置
     */
    isConfigured() {
        this._loadFromStorage();
        return this.initialized;
    }

    /**
     * 获取 Issues 页面链接
     */
    getIssuesUrl() {
        if (this.owner && this.repo) {
            return `https://github.com/${this.owner}/${this.repo}/issues`;
        }
        return null;
    }
}

// 全局 API 实例
const API = new GitHubAPI();
