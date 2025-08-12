import {Notice, Plugin, TFile, TFolder } from 'obsidian';

import { Strings } from 'src/strings';
import {WebviewLLMSettings,WebViewLLMSettingTab,DEFAULT_SETTINGS} from 'src/setting'

import {EasyAPI} from 'src/easyapi/easyapi'

import {BaseWebViewer} from 'src/LLM/BaseWebViewer'
import {DeepSeek} from 'src/LLM/DeepSeek'
import {Doubao} from 'src/LLM/Doubao'
import {Kimi} from 'src/LLM/Kimi'
import { Yuanbao } from 'src/LLM/Yuanbao';
import { ChatGPT } from 'src/LLM/ChatGPT';
import {ChatGLM} from 'src/LLM/ChatGLM';
import { addCommands } from 'src/commands';

export default class WebViewLLMPlugin extends Plugin {
	strings : Strings;
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
			async()=>{
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
		this.basewv = new BaseWebViewer(this.app,'');

		
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

	async cmd_refresh_llms(){
		let views = this.basewv.views;
		this.llms = this.llms.slice(0,0);
		for(let view of views){
			if((view as any).url.startsWith(this.deepseek.homepage)){
				let llm = new DeepSeek(this.app);
				llm.view = view;
				this.deepseek.view = view;
				this.llms.push(llm);
			}else if((view as any).url.startsWith(this.doubao.homepage)){
				let llm = new Doubao(this.app);
				llm.view = view;
				this.doubao.view = view;
				this.llms.push(llm);
			}else if((view as any).url.startsWith(this.kimi.homepage)){
				let llm = new Kimi(this.app);
				llm.view = view;
				this.kimi.view = view;
				this.llms.push(llm);
			}else if((view as any).url.startsWith(this.chatgpt.homepage)){
				let llm = new ChatGPT(this.app);
				llm.view = view;
				this.chatgpt.view = view;
				this.llms.push(llm);
			}else if((view as any).url.startsWith(this.yuanbao.homepage)){
				let llm = new Yuanbao(this.app);
				llm.view = view;
				this.yuanbao.view = view;
				this.llms.push(llm);
			}else if((view as any).url.startsWith(this.chatglm.homepage)){
				let llm = new ChatGLM(this.app);
				llm.view = view;
				this.chatglm.view = view;
				this.llms.push(llm);
			}
		}
	}

	async cmd_chat_sequence(){
		await this.cmd_refresh_llms();
		if(this.llms.length==0){
			return;
		}
		this.auto_chat = true;
		let idx = 0;
		let llm = this.llms[idx];
		let rsp = (await llm.get_last_content()) ?? '';
		while(this.auto_chat && rsp && rsp!=''){
			if(this.settings.auto_stop.split('\n').contains(rsp.trim())){
				this.auto_chat = false;
				break;
			}
			idx = idx+1;
			if(idx==this.llms.length){
				idx=0;
			}
			llm = this.llms[idx];
			rsp = (await llm.request(rsp)) ?? '';
		}
		this.auto_chat = false;
	}

	async get_prompt(tfile:TFile|null,idx=0){
		let prompt = await this.easyapi.editor.get_selection();
		if(prompt!=''){return prompt}

		if(!tfile){return ''}

		let items = this.settings.prompt_name.trim().split('\n');
		if(items.length==0){return ''}

		for(let item of items){
			prompt = await this.easyapi.editor.get_code_section(tfile,item,idx);
			if(prompt){return prompt}

			prompt = await this.easyapi.editor.get_heading_section(tfile,item,idx, false);
			if(prompt){return prompt}
		}
		return '';
	}

	async cmd_chat_every_llms(prompt=''){
		await this.cmd_refresh_llms();
		if(prompt==''){
			prompt = await this.get_prompt(this.easyapi.cfile)
		}
		if(prompt==''){return}
		
		let promises = [];
		for(let llm of this.llms){
			promises.push(llm.request(prompt));
		}
		let responses = await Promise.all(promises);
		return responses;
	}

	async cmd_chat_first_llms(){
		await this.cmd_refresh_llms();

		let prompt = await this.get_prompt(this.easyapi.cfile)
		if(prompt==''){return}
		
		for(let llm of this.llms){
			let rsp = await llm.request(prompt);
			return rsp;
		}
	}

}
