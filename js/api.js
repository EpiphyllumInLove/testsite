class FeedbackAPI {
    constructor() {
        this.workerUrl = 'https://feedback-proxy.minecraft2113367.workers.dev'; 
    }

    async submitFeedback(formData) {
        try {
            const response = await fetch(this.workerUrl, {
                method: 'POST',
                mode: 'cors', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            return result; // 返回 { success: true } 或 { success: false }
        } catch (e) {
            console.error('提交失败:', e);
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }

    getIssuesUrl() {
        return `https://github.com/EpiphyllumInLove/testsite/issues`;
    }
}

const API = new FeedbackAPI();