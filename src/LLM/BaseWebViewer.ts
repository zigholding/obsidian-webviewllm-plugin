
import { App, View, WorkspaceLeaf, Notice } from 'obsidian';

export class BaseWebViewer {
    app: App;
    homepage: any;
    view: View | null; // Declare the type of view
    name: string;

    constructor(app: App, homepage: string = '', name: string = '') {
        this.app = app;
        this.homepage = homepage;
        this.view = this.get_webviews(this.homepage)[0];
        this.name = name;
    }

    get allLeaves() {
        let leaves: Array<WorkspaceLeaf> = [];
        this.app.workspace.iterateAllLeaves(x => {
            leaves.push(x);
        });
        return leaves;
    }

    get allViews() {
        return this.allLeaves.map(
            x => x.view
        )
    }

    // 所有 webview 标签
    get leaves() {
        let leaves = this.allLeaves.filter(
            x => (x.view as any).webview
        );
        return leaves;
    }

    // 所有 webview 视图
    get views() {
        return this.leaves.map(
            x => x.view
        )
    }

    get activeLeaf() {
        let leaves = this.leaves.filter(
            x => (x as any).containerEl.className.contains('mod-active')
        );
        if (leaves.length != 1) {
            return null;
        } else {
            return leaves[0];
        }
    }

    get activeView() {
        let leaf = this.activeLeaf;
        if (leaf) {
            return leaf.view;
        } else {
            return null;
        }
    }

    get webviews_blank() {
        return this.get_webviews('about:blank');
    }

    get webview() {
        if (this.view) {
            return (this.view as any).webview;
        } else {
            return null;
        }
    }

    // 获取指定标签
    get_webviews(prefix: string) {
        return this.views.filter(
            (x: any) => x.url.startsWith(prefix)
        )
    }

    async open_homepage(url = this.homepage, idx = 0) {
        let views = this.get_webviews(url);
        if (idx == -1) {
            idx = views.length;
        }
        while (views.length < idx + 1) {
            let blank = this.webviews_blank;
            if (blank.length == 0) {
                await (this.app as any).commands.executeCommandById('webviewer:open');
                await this.delay(3000);
                blank = this.webviews_blank;
            }
            if (blank.length == 0) {
                return null;
            }

            await (blank[0] as any).webview.executeJavaScript(`
                window.location.href = '${url}';
            `);


            await (blank[0] as any).webview.setAttr('src', url);
            await this.delay(3000);
            views = this.get_webviews(url);
            break;
        }
        if (views.length >= idx + 1) {
            return views[idx];
        } else {
            return null;
        }
    }


    async set_homepage(url = this.homepage, idx = 0) {
        this.view = await this.open_homepage(url, idx);
    }

    async source(view = this.view) {
        if (!view || !(view as any).webview) { return ''; }
        let html = await (view as any).webview.executeJavaScript(`document.documentElement.outerHTML`);
        return html;
    }

    async document(view = this.view) {
        let html = await this.source(this.view);
        let doc = this.html_to_dom(html);
        return doc;
    }

    html_to_dom(html: string) {
        let parser = new DOMParser();
        let dom = parser.parseFromString(html, "text/html");
        return dom;
    }

    async get_turndown(){
        const TurndownService = (await import('turndown')).default;
        const { gfm } = await import('turndown-plugin-gfm');
        const turndown = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            strongDelimiter: '**',
        });
    
        turndown.use(gfm);
        return turndown;
    }
    // 将 html 转换为 markdown
    async html_to_markdown(html: string): Promise<string> {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
    
        // 找出所有 .hyc-common-markdown__ref-list 节点
        doc.querySelectorAll('.hyc-common-markdown__ref-list').forEach(div => {
            const next = div.nextSibling;
    
            // 如果下一个兄弟节点是纯标点文本
            if (next && next.nodeType === 3 && /^[\s。、“”，；！？（）【】]+$/.test(next.nodeValue || '')) {
                let prev = div.previousSibling;
    
                // 如果前一个是元素节点（例如 <strong>），找到它里面最后的文本节点
                if (prev && prev.nodeType === 1) {
                    const textNodes = prev.childNodes;
                    if (textNodes.length > 0) {
                        prev = textNodes[textNodes.length - 1];
                    }
                }
    
                if (prev && prev.nodeType === 3) {
                    prev.nodeValue = (prev.nodeValue || '').trimEnd() + next.nodeValue;
                    next.remove(); // 删除原标点节点
                }
            }
    
            div.remove(); // 删除引用列表 div
        });
    
        html = doc.body.innerHTML;
    
        // Dynamic import to avoid bundling issues
        const turndown = await this.get_turndown();
    
        turndown.addRule('customBlockquote', {
            filter: 'blockquote',
            replacement: (content: any) => `> ${content.trim()}\n\n`,
        });

        turndown.addRule('skipDiv', {
            filter: function (node: any) {
                return (
                    node.nodeName === 'DIV' &&
                    node.classList &&
                    (
                        node.classList.contains('search-plus') ||
                        node.classList.contains('hyc-common-markdown__replace-videoBox-v2')
                    )
                    
                );
            },
            replacement: function () {
                return '';
            }
        });
        
        turndown.addRule('skipTableAction', {
            filter: function (node: any) {
                return (
                    node.nodeName === 'HEADER' &&
                    node.classList &&
                    node.classList.contains('table-actions')
                );
            },
            replacement: function () {
                return '';
            }
        });
    
        return turndown.turndown(html);
    }
    
    async delay(ms: number) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    setActiveLeaf(view = this.view) {
        if (!view) { return };
        let leaf = this.allLeaves.filter(x => x.view == view)[0];
        if (!leaf) { return };
        this.app.workspace.setActiveLeaf(leaf);
    }

    get_safe_ctx(ctx: string) {
        let safeCtx = JSON.stringify(ctx.replace(/`/g, '~').replace(/\$/g, '￥'));
        return safeCtx.slice(1, safeCtx.length - 1);
    }


    async paste_msg(ctx: string) {

    }

    async click_btn_of_send() {

    }

    async number_of_receive_msg() {
        return 0;
    }

    async get_last_content() {
        return '';
    }

    async request(ctx: string, timeout = 60) {

        let N1 = await this.number_of_receive_msg();
        await this.paste_msg(ctx);
        await this.delay(1000);
        await this.click_btn_of_send();
        let N2 = await this.number_of_receive_msg();

        while (N2 != N1 + 1) {
            await this.delay(1000);
            N2 = await this.number_of_receive_msg();
            timeout = timeout - 1;
            if (timeout < 0) {
                break;
            }
        }

        if (N2 == N1 + 1) {
            let ctx = await this.get_last_content();
            new Notice(`${this.name} 说了点什么`)
            return ctx;
        } else {
            new Notice(`${this.name} 不说话`)
            console.log(this.name, N1, N2)
            return null;
        }
    }

} 