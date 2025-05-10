import {Notice, Plugin, TFile, TFolder } from 'obsidian';

import { Strings } from 'src/strings';
import {MySettings,WebViewLLMSettingTab,DEFAULT_SETTINGS} from 'src/setting'

import {DeepSeek} from 'src/LLM/DeepSeek'
import {Doubao} from 'src/LLM/Doubao'
import {Kimi} from 'src/LLM/Kimi'
import {BaseWebViewer} from 'src/LLM/BaseWebViewer'
import { addCommands } from 'src/commands';
import { Yuanbao } from 'src/LLM/Yuanbao';
import { ChatGPT } from 'src/LLM/ChatGPT';

export default class WebViewLLMPlugin extends Plugin {
	strings : Strings;
	settings: MySettings;
	yaml: string;
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

	async onload() {
		
		this.app.workspace.onLayoutReady(
			async()=>{
				await this._onload_()
			}
		)
	}

	get easyapi(){
		return (this.app as any).plugins.plugins['easyapi']?.api;
	}

	async _onload_() {
		// 初始始化，加载中英文和参数
		this.strings = new Strings();
		await this.loadSettings();


		this.llms = [];
		this.deepseek = new DeepSeek(this.app);
		this.doubao = new Doubao(this.app);
		this.kimi = new Kimi(this.app);
		this.yuanbao = new Yuanbao(this.app);
		this.chatgpt = new ChatGPT(this.app)
		this.basellms = [
			this.yuanbao,
			this.chatgpt,
			this.kimi,
			this.doubao,
			this.deepseek,
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



}
