import { 
	App, PluginSettingTab, Setting,Plugin
} from 'obsidian';

import WebViewLLMPlugin from '../main';

export interface WebviewLLMSettings {
	auto_stop: string;
	prompt_name: string;
	skip_html_class: string;
}

export const DEFAULT_SETTINGS: WebviewLLMSettings = {
	prompt_name: 'prompt\n提示词',
	auto_stop: '修改完成\n修改完成。',
	skip_html_class: `
class:
- ybc-li-component_dot # 元宝列表小黑点
- hyc-common-markdown__ref-list # 元宝网页引用数字
- hyc-common-markdown__code__hd # 元宝代码复制按钮
- segment-code-header-content # Kimi代码块复制按钮
name+class:
- div search-plus # 搜索
- div hyc-common-markdown__replace-videoBox-v2 # 元宝视频
- header table-actions # Kimi 表格操作
	`.trim()
}

export class WebViewLLMSettingTab extends PluginSettingTab {
	plugin: WebViewLLMPlugin;
	constructor(app: App, plugin: WebViewLLMPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingValue(field: keyof WebviewLLMSettings) {
		return this.plugin.settings[field];
	}

	add_toggle(name:string,desc:string,field:keyof WebviewLLMSettings){
		let {containerEl} = this;
		let value = (this.plugin.settings as any)[field] as boolean;
		let item = new Setting(containerEl)  
			.setName(name)
			.setDesc(desc)
			.addToggle(text => text
				.setValue(value)
				.onChange(async (value:never) => {
					this.plugin.settings[field] = value;
					await this.plugin.saveSettings();
				})
			);
		return item;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(this.plugin.strings.setting_prompt_name)
			.addTextArea(text => text
				.setValue(this.plugin.settings.prompt_name)
				.onChange(async (value) => {
					this.plugin.settings.prompt_name = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.strings.setting_auto_stop)
			.addTextArea(text => text
				.setValue(this.plugin.settings.auto_stop)
				.onChange(async (value) => {
					this.plugin.settings.auto_stop = value;
					await this.plugin.saveSettings();
				})
			);
		
		new Setting(containerEl)
			.setName(this.plugin.strings.setting_skip_html_class)
			.addTextArea(text => text
				.setValue(this.plugin.settings.skip_html_class)
				.onChange(async (value) => {
					this.plugin.settings.skip_html_class = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
