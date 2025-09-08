import { Notice, Plugin, TFile, TFolder } from 'obsidian';

import { Strings } from 'src/strings';
import { WebviewLLMSettings, WebViewLLMSettingTab, DEFAULT_SETTINGS } from 'src/setting'

import { EasyAPI } from 'src/easyapi/easyapi'

import { BaseWebViewer } from 'src/LLM/BaseWebViewer'
import { DeepSeek } from 'src/LLM/DeepSeek'
import { Doubao } from 'src/LLM/Doubao'
import { Kimi } from 'src/LLM/Kimi'
import { Yuanbao } from 'src/LLM/Yuanbao';
import { ChatGPT } from 'src/LLM/ChatGPT';
import { ChatGLM } from 'src/LLM/ChatGLM';
import { addCommands } from 'src/commands';

export default class WebViewLLMPlugin extends Plugin {
	strings: Strings;
	settings: WebviewLLMSettings;
	yaml: string;

	easyapi: EasyAPI

	dialog_suggest: Function
	dialog_prompt: Function

	llms: Array<BaseWebViewer>;
	basellms: Array<BaseWebViewer>;

	basewv: BaseWebViewer;
	deepseek: DeepSeek;
	doubao: Doubao;
	kimi: Kimi;
	yuanbao: Yuanbao;
	chatgpt: ChatGPT;
	chatglm: ChatGLM;

	auto_chat: boolean;

	async onload() {

		this.app.workspace.onLayoutReady(
			async () => {
				await this._onload_()
			}
		)
	}


	async _onload_() {
		this.auto_chat = true;
		this.easyapi = new EasyAPI(this.app);
		// 初始始化，加载中英文和参数
		this.strings = new Strings();
		await this.loadSettings();
		this.addSettingTab(new WebViewLLMSettingTab(this.app, this));

		this.llms = [];
		this.deepseek = new DeepSeek(this.app);
		this.doubao = new Doubao(this.app);
		this.kimi = new Kimi(this.app);
		this.yuanbao = new Yuanbao(this.app);
		this.chatgpt = new ChatGPT(this.app);
		this.chatglm = new ChatGLM(this.app);
		this.basellms = [
			this.yuanbao,
			this.chatgpt,
			this.kimi,
			this.doubao,
			this.deepseek,
			this.chatglm,
		]
		this.basewv = new BaseWebViewer(this.app, '');


		// 添加命令
		addCommands(this);

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async cmd_refresh_llms() {
		let views = this.basewv.views;
		this.llms = this.llms.slice(0, 0);
		for (let view of views) {
			if ((view as any).url.startsWith(this.deepseek.homepage)) {
				let llm = new DeepSeek(this.app);
				llm.view = view;
				this.deepseek.view = view;
				this.llms.push(llm);
			} else if ((view as any).url.startsWith(this.doubao.homepage)) {
				let llm = new Doubao(this.app);
				llm.view = view;
				this.doubao.view = view;
				this.llms.push(llm);
			} else if ((view as any).url.startsWith(this.kimi.homepage)) {
				let llm = new Kimi(this.app);
				llm.view = view;
				this.kimi.view = view;
				this.llms.push(llm);
			} else if ((view as any).url.startsWith(this.chatgpt.homepage)) {
				let llm = new ChatGPT(this.app);
				llm.view = view;
				this.chatgpt.view = view;
				this.llms.push(llm);
			} else if ((view as any).url.startsWith(this.yuanbao.homepage)) {
				let llm = new Yuanbao(this.app);
				llm.view = view;
				this.yuanbao.view = view;
				this.llms.push(llm);
			} else if ((view as any).url.startsWith(this.chatglm.homepage)) {
				let llm = new ChatGLM(this.app);
				llm.view = view;
				this.chatglm.view = view;
				this.llms.push(llm);
			}
		}
	}

	async cmd_chat_sequence() {
		await this.cmd_refresh_llms();
		if (this.llms.length == 0) {
			return;
		}
		this.auto_chat = true;
		let idx = 0;
		let llm = this.llms[idx];
		let rsp = (await llm.get_last_content()) ?? '';
		let prevs: string[] = [];
		while (this.auto_chat && rsp && rsp != '') {
			if (this.settings.auto_stop.split('\n').contains(rsp.trim())) {
				this.auto_chat = false;
				break;
			}
			rsp = `${llm.name}_${idx}:\n${rsp}`;
			prevs.push(rsp);
			prevs = prevs.slice(-this.llms.length + 1);
			idx = idx + 1;
			if (idx == this.llms.length) {
				idx = 0;
			}
			llm = this.llms[idx];
			rsp = (await llm.request(prevs.join('\n\n---\n\n'))) ?? '';
		}
		this.auto_chat = false;
	}

	async get_prompt(tfile: TFile | null, idx = 0) {
		if (!tfile) { return '' }
		let prompt:any = '';
		let items = this.settings.prompt_name.trim().split('\n');
		if (items.length == 0) { return '' }

		// 添加首字母大写和全部大写的变体
		let allItemsSet = new Set(items);
		for (let item of items) {
			// 首字母大写
			let firstUpper = item.charAt(0).toUpperCase() + item.slice(1);
			allItemsSet.add(firstUpper);
			// 全部大写
			let allUpper = item.toUpperCase();
			allItemsSet.add(allUpper);
		}
		let allItems = Array.from(allItemsSet);

		for (let item of allItems) {
			prompt = await this.easyapi.editor.get_code_section(tfile, item, idx);
			if (prompt) { return prompt }

			prompt = await this.easyapi.editor.get_heading_section(tfile, item, idx, false);
			if (prompt) { return prompt }
		}

		if (!prompt) {
			prompt = await this.easyapi.nc.editor.remove_metadata(tfile);
		}
		return '';
	}

	async get_last_active_llm() {
		await this.cmd_refresh_llms();
		let llm = this.llms.sort(
			(a: any, b: any) => b.view.leaf.activeTime - a.view.leaf.activeTime
		)[0];
		return llm;
	}

	async cmd_chat_every_llms(prompt = '') {
		await this.cmd_refresh_llms();
		if (prompt == '') {
			prompt = await this.get_prompt(this.easyapi.cfile)
		}
		if (prompt == '') { return }

		let promises = [];
		for (let llm of this.llms) {
			promises.push(llm.request(prompt));
		}
		let responses = await Promise.all(promises);
		return responses;
	}

	async cmd_chat_first_llms() {
		let llm = await this.get_last_active_llm();
		if (!llm) { return }

		let prompt = await this.get_prompt(this.easyapi.cfile)
		if (prompt == '') { return }

		let rsp = await llm.request(prompt);
		return rsp;
	}

	async cmd_chat_with_target_tfile(tfile: TFile | null = null, target: any = null) {
		let llm = await this.get_last_active_llm();
		if (!llm) {
			new Notice('请先选择一个LLM');
			return;
		}
	
		let ea = this.easyapi;
		let cfile = ea.cfile;
	
		// --- 确定 tfile ---
		if (!tfile) {
			let tfiles = ea.file.get_all_tfiles_of_tags(
				this.settings.prompt_name.trim().split('\n')
			);
			if (ea.cfile && tfiles.contains(ea.cfile)) {
				tfile = ea.cfile;
			} else {
				if (ea.cfile && !tfiles.contains(ea.cfile)) {
					tfiles.unshift(ea.cfile);
				}
				tfile = await ea.nc.chain.sugguster_note(tfiles);
			}
		}
		if (!tfile) return;
	
		let prompt = await this.get_prompt(tfile);
		// --- 处理条件占位符 ${xxx?yyy} ---
		const conditionalRegex = /\$\{([a-zA-Z0-9.]+)\?([a-zA-Z0-9.]+)\}/g;
		let selectionValue = null;
		let hasSelection = false;
	
		if (prompt.includes("${selection}") || conditionalRegex.test(prompt)) {
			selectionValue = await this.easyapi.editor.get_selection();
			hasSelection = !!selectionValue;
		}
	
		prompt = prompt.replace(conditionalRegex, (match: string, primary: string, fallback: string) => {
			if (primary === "selection") {
				return hasSelection ? "${selection}" : "${" + fallback + "}";
			}
			return match;
		});
	
		// --- 常规占位符替换 ---
		const replacements = new Map();
	
		if (hasSelection) replacements.set("${selection}", selectionValue);
	
		if (ea.cfile) {
			replacements.set("${tfile.basename}", ea.cfile.basename);
			replacements.set("${tfile.path}", ea.cfile.path);
	
			if (prompt.includes("${tfile.content}")) {
				let ctx = await ea.nc.editor.remove_metadata(ea.cfile);
				replacements.set("${tfile.content}", ctx);
			}
	
			if (prompt.includes("${tfile.brothers}")) {
				let ctx = "- " + ea.nc.chain.get_brothers(ea.cfile).map((x: TFile) => x.basename).join("\n- ");
				replacements.set("${tfile.brothers}", ctx);
			}
	
			if (prompt.includes("${tfile}")) {
				let ctx = await ea.ccontent;
				ctx = `Name: ${ea.cfile.basename}\n\nPath: ${ea.cfile.path}\n\n${ctx}`;
				replacements.set("${tfile}", ctx);
			}
		}
	
		if (!hasSelection && prompt.includes("${selection}")) {
			new Notice("请选择文本/Select text first");
			return;
		}
	
		// --- 处理 [[子模板]] ---
		const sparasRegex = /\$\{\[\[(.*?)\]\]\}/g;
		let amatches = new Set<string>();
		let amatch;
		sparasRegex.lastIndex = 0;
		while ((amatch = sparasRegex.exec(prompt)) !== null) {
			amatches.add(amatch[1]);
		}
		for (let amatch of amatches) {
			let xfile = ea.file.get_tfile(amatch);
			if (xfile) {
				let ctx = await ea.tpl.parse_templater(xfile, true, { cfile: ea.cfile });
				replacements.set(`\$\{[[${amatch}]]\}`, ctx.join('\n'));
			}
		}
	
		// --- 应用占位符替换 ---
		const placeholderRegex = new RegExp(
			Array.from(replacements.keys()).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
			'g'
		);
		prompt = prompt.replace(placeholderRegex, (m: string) => replacements.get(m) || m);
	
		// --- 处理 prompt.xxx 占位符，保证弹窗输入 ---
		const promptRegex = /\$\{prompt\.([a-zA-Z0-9_]+)\}/g;
		let promptMatches: Set<string> = new Set();
		let pMatch;
		promptRegex.lastIndex = 0;
		while ((pMatch = promptRegex.exec(prompt)) !== null) {
			promptMatches.add(pMatch[1]);
		}
	
		for (let placeholder of promptMatches) {
			let title = placeholder.charAt(0).toUpperCase() + placeholder.slice(1);
			let ctx = await ea.dialog_prompt(title, `Enter value for ${placeholder}...`);
			if (ctx === void 0 || ctx === null) return null;
			prompt = prompt.replace(new RegExp(`\\$\\{prompt\\.${placeholder}\\}`, 'g'), ctx);
		}
	
		// --- 处理 target 替换 ---
		if (typeof target === "string" && target.trim() !== "") {
			prompt = prompt.replace(/\$\{.*?\}/g, target.trim());
		} else if (Array.isArray(target)) {
			for (let i of target) prompt = prompt.replace(/\$\{.*?\}/, i);
		} else if (typeof target === "object") {
			for (let k in target) prompt = prompt.replace(`\${${k}}`, target[k]);
		}
	
		// --- 调用 LLM ---
		if (llm) {
			let req = await llm.request(prompt);
			let codes = await ea.editor.extract_code_block(tfile, "js //templater");
			if (codes.length === 0 && req) {
				if (llm.view) this.app.workspace.setActiveLeaf(llm.view.leaf);
			} else {
				await ea.tpl.parse_templater(tfile, true, { cfile, llm: req });
			}
		}
	}
	

	async cmd_paste_last_active_llm() {
		let llm = await this.get_last_active_llm();
		if (!llm) { return }
		let rsp = await llm.get_last_content();
		if (!rsp) { return }
		this.easyapi.ceditor.replaceSelection(rsp);
	}

	async cmd_paste_to_markdown(anyblock = 'list2tab') {
		let tfile = this.easyapi.cfile;
		if (!tfile) { return }

		await this.cmd_refresh_llms();

		let llms = this.llms;
		if (llms.length == 0) { return }

		let rsps = await Promise.all(llms.map(x => x.get_last_content()));
		let xtx = '';
		if (llms.length > 1) {
			xtx = `[${anyblock}|addClass(ab-col${llms.length})]\n`
		}
		for (let i in rsps) {
			let name = llms[i].name;
			xtx = xtx + '\n' + `
- ${name}
\`\`\`dataviewjs
dv.span(
	${JSON.stringify(rsps[i])}
)
\`\`\`
		`.trim().replace(/\n/g, '\n\t');
		}
		xtx = '\n\n' + xtx.trim() + '\n\n'
		this.easyapi.ceditor.replaceSelection(xtx);
	}

	async get_turndown() {
		let TurndownService = (await import('turndown')).default;
		let { gfm } = await import('turndown-plugin-gfm');
		let turndown = new TurndownService({
			headingStyle: 'atx',
			bulletListMarker: '-',
			codeBlockStyle: 'fenced',
			emDelimiter: '*',
			strongDelimiter: '**',
		});

		turndown.use(gfm);
		return turndown;
	}

	get turndown_styles() {
		let yamljs = this.easyapi.editor.yamljs;
		let config = yamljs.load(this.settings.turndown_styles);
		if (!config['pre-process']) { config['pre-process'] = [] }
		if (!config['script']) { config['script'] = [] }
		if (!config['class']) { config['class'] = [] }
		if (!config['name+class']) { config['name+class'] = [] }
		if (!config['key+value']) { config['key+value'] = [] }
		if (!config['post-process']) { config['post-process'] = [] }
		return config;
	}
	// 将 html 转换为 markdown
	async html_to_markdown(html: string): Promise<string> {
		let turndown_styles = this.turndown_styles;

		if (Array.isArray(turndown_styles['pre-process'])) {
			let eatra = { html: html };
			for (let i of turndown_styles['pre-process']) {
				let htmls = await this.easyapi.tpl.parse_templater(i, true, eatra);
				html = eatra['html'];
			}
		}

		let parser = new DOMParser();
		let doc = parser.parseFromString(html, 'text/html');
		// 找出所有 .hyc-common-markdown__ref-list 节点
		doc.querySelectorAll('.hyc-common-markdown__ref-list').forEach(div => {
			let next = div.nextSibling;

			// 如果下一个兄弟节点是纯标点文本
			if (next && next.nodeType === 3 && /^[\s。、“”，；！？（）【】：]+$/.test(next.nodeValue || '')) {
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

			div.remove();
		});

		html = doc.body.innerHTML;

		// Dynamic import to avoid bundling issues
		const turndown = await this.get_turndown();

		turndown.addRule("fixedTable", {
			filter: ["table"],
			replacement: (content, node) => {
				const rows = [];
				// 处理表头
				const headers = Array.from(node.querySelectorAll("th")).map(th =>
					(th as any).textContent.replace(/\s+/g, " ").trim()
				);
				if (headers.length > 0) {
					rows.push(`| ${headers.join(" | ")} |`); // 确保首尾有 |
					rows.push(`| ${headers.map(() => "---").join(" | ")} |`); // 对齐行
				}

				// 处理数据行
				node.querySelectorAll("tr").forEach(tr => {
					const cols = Array.from(tr.querySelectorAll("td")).map(td =>
						(td as any).textContent.replace(/\s+/g, " ").trim()
					);
					if (cols.length > 0) {
						rows.push(`| ${cols.join(" | ")} |`); // 每行强制添加 |
					}
				});
				return rows.join("\n") + "\n\n"; // 每行结尾换行
			}
		});

		turndown.addRule('skip_class', {
			filter: function (node) {
				if (node.classList) {
					try {
						for (let i of turndown_styles.class) {
							let reg = new RegExp(i);
							for (let c of Array.from(node.classList)) {
								if (c.match(reg)) {
									return true;
								}
							}
						}
					} catch (e) {
						// do nothing
					}
					try {
						for (let i of turndown_styles['name+class']) {
							let items = i.trim().split(' ');
							if (items.length == 1) {
								if (node.nodeName.toLowerCase() == items[0]) {
									return true;
								}
							} else {
								let reg = new RegExp(items[1]);
								if (node.nodeName.toLowerCase() == items[0]) {
									for (let c of Array.from(node.classList)) {
										if (c.match(reg)) {
											return true;
										}
									}
								}
							}

						}
					} catch (e) {
						// do nothing
					}
				}
				try {
					for (let i of turndown_styles['key+value']) {
						let items = i.split(' ');
						let reg = new RegExp(items[1]);
						if (node.nodeType == 1) {
							return !!node.getAttribute(items[0])?.match(reg)
						}
					}
				} catch (e) {
					// do nothing
				}
				return false;
			},
			replacement: function () {
				return '';
			}
		});

		turndown.addRule('customBlockquote', {
			filter: 'blockquote',
			replacement: (content: any) => `> ${content.trim()}\n\n`,
		});

		if (Array.isArray(turndown_styles['script'])) {
			for (let i of turndown_styles['script']) {
				await this.easyapi.tpl.parse_templater(i, true, turndown);
			}
		}

		turndown.addRule('hycCodeBlock', {
			filter: (node) =>
				node.nodeName === 'DIV' && node.classList.contains('hyc-code-scrollbar__view'),
			replacement: (content, node) => {
				// 找内部的 <code>
				let codeNode = node.querySelector('code');
				let lang = '';
				if (codeNode && codeNode.className.match(/language-(\w+)/)) {
					lang = RegExp.$1; // 提取 language-javascript
				}
				let codeText = codeNode ? codeNode.textContent : node.textContent;

				return `\`\`\`${lang}\n${codeText?.trim()}\n\`\`\``;
			}
		});

		let md = turndown.turndown(html);
		if (Array.isArray(turndown_styles['post-process'])) {
			let eatra = { md: md };
			for (let i of turndown_styles['post-process']) {
				await this.easyapi.tpl.parse_templater(i, true, eatra);
				md = eatra['md'];
			}
		}
		return md;
	}
}
