/**
 * GitHub API 操作工具
 * 用于将反馈提交到 GitHub Issues
 */
class GitHubAPI {
    constructor() {
        // 从环境变量或配置中读取
        this.owner = '';      // GitHub 用户名
        this.repo = '';       // 仓库名
        this.token = '';      // Personal Access Token
        this.initialized = false;
    }

    /**
     * 初始化配置
     */
    init(owner, repo, token) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.initialized = true;
    }

    /**
     * 提交反馈 - 创建 GitHub Issue
     */
    async submitFeedback(formData) {
        // 如果未配置，尝试从本地存储读取
        if (!this.initialized) {
            const saved = localStorage.getItem('github_config');
            if (saved) {
                try {
                    const config = JSON.parse(saved);
                    this.init(config.owner, config.repo, config.token);
                } catch (e) {
                    // 忽略
                }
            }
        }

        // 如果仍然未配置，使用备用方案
        if (!this.initialized || !this.token) {
            return this.submitFallback(formData);
        }

        const title = `[反馈] ${formData.type} - ${formData.title}`;
        const body = [
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
                        title: title,
                        body: body,
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
            // 降级到备用方案
            return this.submitFallback(formData);
        }
    }

    /**
     * 备用方案 - 如果 GitHub API 不可用
     * 将反馈保存到 localStorage，并提示用户
     */
    async submitFallback(formData) {
        try {
            const feedbacks = JSON.parse(localStorage.getItem('pending_feedback') || '[]');
            feedbacks.push(formData);
            localStorage.setItem('pending_feedback', JSON.stringify(feedbacks));
            return {
                success: true,
                warning: true,
                message: '反馈已本地保存。请配置 GitHub 信息以自动提交到仓库。'
            };
        } catch (e) {
            return {
                success: false,
                error: '无法保存反馈，请稍后重试或通过 GitHub Issues 直接提交。'
            };
        }
    }

    /**
     * 保存 GitHub 配置
     */
    saveConfig(owner, repo, token) {
        this.init(owner, repo, token);
        localStorage.setItem('github_config', JSON.stringify({ owner, repo, token }));
    }

    /**
     * 清除配置
     */
    clearConfig() {
        this.initialized = false;
        this.owner = '';
        this.repo = '';
        this.token = '';
        localStorage.removeItem('github_config');
    }
}

// 全局 API 实例
const API = new GitHubAPI();

/**
 * 管理员后台配置
 * 在浏览器控制台中调用：
 *   API.saveConfig('your-github-username', 'your-repo-name', 'your-personal-access-token')
 */
