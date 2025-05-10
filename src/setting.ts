import { 
	App, PluginSettingTab, Setting,Plugin
} from 'obsidian';

import WebViewLLMPlugin from '../main';

export interface MySettings {
	strict_mode: boolean;
	vaultDir:string;
	deepseekFolder: string;
	doubaoFolder: string;
	kimiFolder: string;
}

export const DEFAULT_SETTINGS: MySettings = {
	strict_mode:false,
	vaultDir:''
}

export class WebViewLLMSettingTab extends PluginSettingTab {
	plugin: WebViewLLMPlugin;
	constructor(app: App, plugin: WebViewLLMPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingValue(field: keyof MySettings) {
		return this.plugin.settings[field];
	}

	add_toggle(name:string,desc:string,field:keyof MySettings){
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
				.setName(this.plugin.strings.setting_vault_dir)
				.addTextArea(text => text
					.setValue(this.plugin.settings.vaultDir)
					.onChange(async (value) => {
						this.plugin.settings.vaultDir = value;
						await this.plugin.saveSettings();
					}));
					
		this.add_toggle(
			this.plugin.strings.setting_strict_mode,
			this.plugin.strings.setting_strict_mode_desc,
			'strict_mode'
		);
	}
}
