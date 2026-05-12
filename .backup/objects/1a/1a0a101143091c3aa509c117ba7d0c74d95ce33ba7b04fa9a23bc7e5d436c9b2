/**
 * 前端路由 - 管理页面切换
 */
class Router {
    constructor() {
        this.currentPage = 'about';
        this.workFiles = [];
        this.init();
    }

    async init() {
        // 加载作品列表
        await this.loadWorkList();
        // 监听浏览器回退/前进
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigate(e.state.page, true);
            } else {
                this.navigate('about', true);
            }
        });
        // 默认加载首页
        this.navigate('about');
    }

    /**
     * 从 works/ 目录加载作品文件列表
     */
    async loadWorkList() {
        try {
            const response = await fetch('works/');
            // 如果是 GitHub Pages / Cloudflare Pages，无法直接列出目录
            // 改为从 works-list.json 读取
            const listResp = await fetch('works-list.json');
            if (listResp.ok) {
                this.workFiles = await listResp.json();
            } else {
                // 降级：尝试从已知的 works 列表示文件读取
                console.warn('无法加载作品列表，请确保 works-list.json 存在');
                this.workFiles = [];
            }
        } catch (e) {
            console.warn('加载作品列表失败:', e.message);
            this.workFiles = [];
        }
    }

    /**
     * 导航到指定页面
     * @param {string} page - 页面名称: about | works | feedback | work-xxx
     * @param {boolean} noPushState - 是否不修改浏览器历史
     */
    async navigate(page, noPushState = false) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">加载中...</div>';

        // 更新导航栏高亮
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        const navLinks = document.querySelectorAll('.nav-links a');
        if (page === 'about') navLinks[0]?.classList.add('active');
        else if (page === 'works') navLinks[1]?.classList.add('active');
        else if (page === 'feedback') navLinks[2]?.classList.add('active');

        // 关闭移动端菜单
        const nav = document.querySelector('.nav-links');
        if (nav) nav.classList.remove('show');

        this.currentPage = page;

        if (!noPushState) {
            window.history.pushState({ page }, '', `#${page}`);
        }

        try {
            if (page === 'about') {
                const html = await this.loadPage('pages/about.html');
                app.innerHTML = html;
                this.afterAboutRender();
            } else if (page === 'works') {
                const html = await this.loadPage('pages/works.html');
                app.innerHTML = html;
                this.afterWorksRender();
            } else if (page === 'feedback') {
                const html = await this.loadPage('pages/feedback.html');
                app.innerHTML = html;
                this.afterFeedbackRender();
            } else if (page.startsWith('work-')) {
                const workId = page.replace('work-', '');
                await this.renderWorkDetail(workId);
            } else {
                // 默认回退到 about
                this.navigate('about', true);
            }
        } catch (e) {
            app.innerHTML = `<div class="empty-state"><p>页面加载失败: ${e.message}</p></div>`;
        }
    }

    /**
     * 加载外部HTML片段
     */
    async loadPage(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`无法加载页面 (${response.status})`);
        }
        return await response.text();
    }

    /**
     * 介绍页渲染完成后的回调
     */
    afterAboutRender() {
        // 可以在这里添加介绍页的额外逻辑
    }

    /**
     * 作品页渲染完成后的回调
     */
    afterWorksRender() {
        this.renderWorkCards();
    }

    /**
     * 反馈页渲染完成后的回调
     */
    afterFeedbackRender() {
        this.setupFeedbackForm();
    }

    /**
     * 渲染作品卡片列表
     */
    renderWorkCards() {
        const grid = document.getElementById('works-grid');
        if (!grid) return;

        if (this.workFiles.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>暂无作品，敬请期待~</p></div>';
            return;
        }

        grid.innerHTML = '';
        this.workFiles.forEach(work => {
            const card = document.createElement('div');
            card.className = 'work-card';
            card.onclick = () => this.navigate(`work-${work.id}`);

            const imageUrl = work.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect fill="%23f0f0f0" width="400" height="200"/%3E%3Ctext fill="%23ccc" font-family="Arial" font-size="20" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3E暂无封面%3C/text%3E%3C/svg%3E';

            card.innerHTML = `
                <img class="work-card-image" src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(work.title)}" loading="lazy" onerror="this.src='data:image/svg+xml,%253Csvg xmlns=%2522http://www.w3.org/2000/svg%2522 width=%2522400%2522 height=%2522200%2522 viewBox=%25220 0 400 200%2522%253E%253Crect fill=%2522%2523f0f0f0%2522 width=%2522400%2522 height=%2522200%2522/%253E%253Ctext fill=%2522%2523ccc%2522 font-family=%2522Arial%2522 font-size=%252220%2522 x=%252250%2525%2522 y=%252250%2525%2522 dominant-baseline=%2522middle%2522 text-anchor=%2522middle%2522%253E暂无封面%253C/text%253E%253C/svg%253E'">
                <div class="work-card-content">
                    <div class="work-card-title">${this.escapeHtml(work.title)}</div>
                    ${work.desc ? `<div class="work-card-desc">${this.escapeHtml(work.desc)}</div>` : ''}
                    ${work.tags && work.tags.length ? `
                        <div class="work-card-tags">
                            ${work.tags.map(t => `<span class="work-card-tag">${this.escapeHtml(t)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /**
     * 渲染作品详情
     */
    async renderWorkDetail(workId) {
        const app = document.getElementById('app');
        const work = this.workFiles.find(w => w.id === workId);

        if (!work) {
            app.innerHTML = `
                <div class="work-detail">
                    <a class="back-btn" onclick="router.navigate('works')">← 返回作品列表</a>
                    <div class="empty-state"><p>作品不存在</p></div>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="work-detail">
                <a class="back-btn" onclick="router.navigate('works')">← 返回作品列表</a>
                <div class="work-detail-header">
                    <h1 class="work-detail-title">${this.escapeHtml(work.title)}</h1>
                    <div class="work-detail-meta">${work.date || ''}</div>
                </div>
                <div class="work-detail-content" id="work-content">
                    <div class="loading">加载作品内容中...</div>
                </div>
            </div>
        `;

        try {
            const response = await fetch(`works/${work.file}`);
            if (!response.ok) throw new Error('文件未找到');
            const markdown = await response.text();
            const html = marked.parse(markdown);
            document.getElementById('work-content').innerHTML = html;
            document.title = `${work.title} - 个人汉化资源站`;
        } catch (e) {
            document.getElementById('work-content').innerHTML = `
                <div class="empty-state">
                    <p>加载失败: ${e.message}</p>
                    <p style="font-size:0.9rem;margin-top:10px;color:#999;">请检查 works/${work.file} 是否存在</p>
                </div>
            `;
        }
    }

    /**
     * 设置反馈表单
     */
    setupFeedbackForm() {
        const form = document.getElementById('feedback-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-btn');
            const messageDiv = document.getElementById('form-message');

            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            messageDiv.className = 'form-message';
            messageDiv.style.display = 'none';

            const formData = {
                type: document.getElementById('feedback-type').value,
                title: document.getElementById('feedback-title').value.trim(),
                content: document.getElementById('feedback-content').value.trim(),
                contact: document.getElementById('feedback-contact').value.trim(),
                timestamp: new Date().toISOString()
            };

            try {
                const result = await API.submitFeedback(formData);
                if (result.success) {
                    messageDiv.className = 'form-message success';
                    messageDiv.textContent = '反馈已成功提交，感谢您的支持！';
                    messageDiv.style.display = 'block';
                    form.reset();
                } else {
                    throw new Error(result.error || '提交失败');
                }
            } catch (err) {
                messageDiv.className = 'form-message error';
                messageDiv.textContent = `提交失败：${err.message}。您也可以直接通过 GitHub Issues 提交反馈。`;
                messageDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '提交反馈';
            }
        });
    }

    /**
     * HTML 转义
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化路由
const router = new Router();

// 移动端菜单切换
function toggleMenu() {
    const nav = document.querySelector('.nav-links');
    nav.classList.toggle('show');
}

// 处理 hash 变化
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        router.navigate(hash, true);
    }
});
