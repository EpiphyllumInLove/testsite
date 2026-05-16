/**
 * 多通道反馈提交 API
 * 主通道：Cloudflare Workers
 * 兜底方案：生成可复制的 Issue 文本，让用户手动提交
 */
class FeedbackAPI {
    constructor() {
        // ====== 配置区 ======
        // 你的 Worker 地址（可以配置多个，按优先级自动切换）
        this.workerUrls = [
            'feedback-proxy.minecraft2113367.workers.dev', // workers.dev 通道
            // 绑定自定义域名后加在这里（国内访问更稳定）:
            // 'feedback-proxy.yousei.top',
        ];

        this.owner = 'EpiphyllumInLove';
        this.repo = 'testsite';
        // ==================
    }

    /**
     * 提交反馈（自动多通道重试）
     */
    async submitFeedback(formData) {
        // 逐个尝试 Worker 通道
        for (let i = 0; i < this.workerUrls.length; i++) {
            try {
                const result = await this._submitViaWorker(formData, this.workerUrls[i]);
                if (result.success) {
                    return result;
                }
                console.warn(`Worker[${i}] 提交失败:`, result.error);
            } catch (e) {
                console.warn(`Worker[${i}] 网络错误:`, e.message);
            }
        }

        // 所有 Worker 都失败 → 生成降级文本
        return this._generateFallback(formData);
    }

    /**
     * 通过单个 Worker 提交
     */
    async _submitViaWorker(formData, workerUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formData.type,
                    title: formData.title,
                    content: formData.content,
                    contact: formData.contact,
                    timestamp: formData.timestamp || new Date().toISOString(),
                    owner: this.owner,
                    repo: this.repo
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);
            return await response.json();
        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    }

    /**
     * 生成降级方案：可复制的 Issue 内容
     */
    _generateFallback(formData) {
        return {
            success: false,
            fallback: true,
            title: formData.title,
            error: '无法直接连接到服务器，请复制下方内容，手动到 GitHub Issues 页面提交',
            copyText: `### 标题\n${formData.title}\n\n### 内容\n${formData.content}\n\n（反馈类型: ${formData.type || '其他'}）${formData.contact ? '\n联系方式: ' + formData.contact : ''}`
        };
    }

    /**
     * 获取 Issues 页面链接
     */
    getIssuesUrl() {
        return `https://github.com/${this.owner}/${this.repo}/issues`;
    }
}

const API = new FeedbackAPI();