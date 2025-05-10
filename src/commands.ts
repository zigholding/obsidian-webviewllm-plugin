import { 
	Notice, TFile
} from 'obsidian';

import WebViewLLMPlugin from '../main';
import { DeepSeek } from './LLM/DeepSeek';
import { Doubao } from './LLM/Doubao';
import { Kimi } from './LLM/Kimi';

const cmd_refresh_llms = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_refresh_llms',
	name: plugin.strings.cmd_refresh_llms,
	callback: async () => {
		let views = plugin.basewv.views;
		plugin.llms = plugin.llms.slice(0,0);
		for(let view of views){
			if((view as any).url.startsWith(plugin.deepseek.homepage)){
				let llm = new DeepSeek(plugin.app);
				llm.view = view;
				plugin.llms.push(llm);
			}else if((view as any).url.startsWith(plugin.doubao.homepage)){
				let llm = new Doubao(plugin.app);
				llm.view = view;
				plugin.llms.push(llm);
			}else if((view as any).url.startsWith(plugin.kimi.homepage)){
				let llm = new Kimi(plugin.app);
				llm.view = view;
				plugin.llms.push(llm);
			}
		}
	}
});


const cmd_open_new_llm = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_open_new_llm',
	name: plugin.strings.cmd_open_new_llm,
	callback: async () => {
		let hpage = await plugin.easyapi.dialog_suggest(
			plugin.basellms.map(x=>x.name),
			plugin.basellms.map(x=>x.homepage)
		)
		if(hpage){
			await plugin.basewv.open_homepage(hpage,-1);
		}
	}
});

const commandBuilders:Array<Function> = [
    
];

const commandBuildersDesktop:Array<Function> = [
	cmd_refresh_llms,
	cmd_open_new_llm
];

export function addCommands(plugin:WebViewLLMPlugin) {
    commandBuilders.forEach((c) => {
        plugin.addCommand(c(plugin));
    });
	if((plugin.app as any).isMobile==false){
		commandBuildersDesktop.forEach((c) => {
			plugin.addCommand(c(plugin));
		});
	}
}