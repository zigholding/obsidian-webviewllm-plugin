
import { App, View, WorkspaceLeaf, Notice } from 'obsidian';


export class BaseWebViewer {
    app: App;
    homepage: any;
    view: View | null; // Declare the type of view
    name: string;

    constructor(app: App, homepage: string = '', name:string='') {
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
    get views(){
        return this.leaves.map(
            x => x.view
        )
    }
    
    get activeLeaf(){
        let leaves = this.leaves.filter(
            x => (x as any).containerEl.className.contains('mod-active')
        );
        if(leaves.length!=1){
            return null;
        }else{
            return leaves[0];
        }
    }

    get activeView(){
        let leaf = this.activeLeaf;
        if(leaf){
            return leaf.view;
        }else{
            return null;
        }
    }

    get webviews_blank() {
        return this.get_webviews('about:blank');
    }

    get webview(){
        if(this.view){
            return (this.view as any).webview;
        }else{
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
        if(idx==-1){
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

    html_to_markdown(html:string) {
        let doc = this.html_to_dom(html);

        function tree(node:any, level = 1) {
            node.childNodes.forEach((child:any) => {
                tree(child, level + 1);
            })
        }

        tree(doc)
        function convertNode(node:any) {
            let markdown = "";

            if (node.nodeType === 1) { // Node.ELEMENT_NODE
                switch (node.nodeName.toLowerCase()) {
                    case "h1":
                    case "h2":
                    case "h3":
                    case "h4":
                    case "h5":
                    case "h6":
                        let level = parseInt(node.nodeName.charAt(1), 10);
                        markdown += "#".repeat(level) + " " + node.textContent.trim() + "\n\n";
                        break;

                    case "p":
                        markdown += node.textContent.trim() + "\n\n";
                        break;

                    case "ul":
                    case "ol":
                        node.childNodes.forEach((child:any) => {
                            if (child.nodeName.toLowerCase() === "li") {
                                markdown += "- " + child.textContent.trim() + "\n";
                            }
                        });
                        markdown += "\n";
                        break;

                    case "a":
                        markdown += `[${node.textContent.trim()}](${node.getAttribute("href")})`;
                        break;

                    case "img":
                        markdown += `![${node.getAttribute("alt") || "Image"}](${node.getAttribute("src")})`;
                        break;

                    case "strong":
                    case "b":
                        markdown += `**${node.textContent.trim()}**`;
                        break;

                    case "em":
                    case "i":
                        markdown += `*${node.textContent.trim()}*`;
                        break;

                    case "blockquote":
                        markdown += "> " + node.textContent.trim() + "\n\n";
                        break;

                    case "pre":
                        if (node.firstChild && node.firstChild.nodeName.toLowerCase() === "code") {
                            let code = node.firstChild.textContent.trim();
                            markdown += "```" + "\n" + code + "\n" + "```" + "\n\n";
                        }
                        break;

                    case 'code':
                        markdown += "`" + node.textContent + "`";
                        break;

                    case '#text':
                        markdown += node.textContent.trim();
                        break;

                    default:
                        node.childNodes.forEach((child:any) => {
                            markdown += convertNode(child);
                        });
                }
            } else if (node.nodeType === 3) { //Node.TEXT_NODE
                markdown += node.textContent.trim();
            }
            return markdown;
        }
        let md = convertNode(doc.body);
        return md;
    }

    async delay(ms: number) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    setActiveLeaf(view=this.view){
        if(!view){return};
        let leaf = this.allLeaves.filter(x=>x.view==view)[0];
        if(!leaf){return};
        this.app.workspace.setActiveLeaf(leaf);
    }

    get_safe_ctx(ctx:string){
        let safeCtx = JSON.stringify(ctx.replace(/`/g,'~').replace(/\$/g,'￥'));
        return safeCtx;
    }


    async paste_msg(ctx:string){

    }

    async click_btn_of_send(){

    }

    async number_of_receive_msg(){
        return 0;
    }

    async get_last_content(){
        return '';
    }

    async request(ctx:string,timeout=60){

		let N1 = await this.number_of_receive_msg();

		await this.paste_msg(ctx);
		await this.delay(1000);
		await this.click_btn_of_send();
		let N2 = await this.number_of_receive_msg();
		
		while(N2!=N1+1){
			await this.delay(1000);
			N2 = await this.number_of_receive_msg();
			timeout = timeout-1;
			if(timeout<0){
				break;
			}
		}

		if(N2==N1+1){
			let ctx = await this.get_last_content();
			new Notice(`${this.name} 说了点什么`)
			return ctx;
		}else{
			new Notice(`${this.name} 不说话`)
			console.log('Doubao N:',N1,N2)
			return null;
		}
	}

} 