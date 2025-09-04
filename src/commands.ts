import { 
	Notice, TFile
} from 'obsidian';

import WebViewLLMPlugin from '../main';
import { DeepSeek } from './LLM/DeepSeek';
import { Doubao } from './LLM/Doubao';
import { Kimi } from './LLM/Kimi';
import { ChatGPT } from './LLM/ChatGPT';

const cmd_refresh_llms = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_refresh_llms',
	name: plugin.strings.cmd_refresh_llms,
	callback: async () => {
		plugin.cmd_refresh_llms();
	}
});

const cmd_chat_sequence = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_chat_sequence',
	name: plugin.strings.cmd_chat_sequence,
	callback: async () => {
		await plugin.cmd_chat_sequence();
	}
});

const cmd_chat_sequence_stop = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_chat_sequence_stop',
	name: plugin.strings.cmd_chat_sequence_stop,
	callback: async () => {
		plugin.auto_chat = false;
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

const cmd_chat_every_llms = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_chat_every_llms',
	name: plugin.strings.cmd_chat_every_llms,
	callback: async () => {
		await plugin.cmd_chat_every_llms();
	}
});

const cmd_chat_first_llms = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_chat_first_llms',
	name: plugin.strings.cmd_chat_first_llms,
	callback: async () => {
		await plugin.cmd_chat_first_llms();
	}
});

const cmd_paste_last_active_llm = (plugin:WebViewLLMPlugin) => ({

	id: 'cmd_paste_last_active_llm',
	name: plugin.strings.cmd_paste_last_active_llm,
	callback: async () => {
		await plugin.cmd_paste_last_active_llm();
	}
});

const cmd_paste_ai_contents_as_list2tab = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_paste_ai_contents_as_list2tab',
	name: plugin.strings.cmd_paste_ai_contents_as_list2tab,
	callback: async () => {
		await plugin.cmd_paste_to_markdown('list2tab');
	}
});

const cmd_paste_ai_contents_as_list2card = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_paste_ai_contents_as_list2card',
	name: plugin.strings.cmd_paste_ai_contents_as_list2card,
	callback: async () => {
		await plugin.cmd_paste_to_markdown('list2card');
	}
});

const cmd_chat_with_target_tfile = (plugin:WebViewLLMPlugin) => ({
	id: 'cmd_chat_with_target_tfile',
	name: plugin.strings.cmd_chat_with_target_tfile,
	hotkeys: [{ modifiers: ['Alt'], key: 'F' }],
	callback: async () => {
		await plugin.cmd_chat_with_target_tfile();
	}
});

const commandBuilders:Array<Function> = [
    
];

const commandBuildersDesktop:Array<Function> = [
	// cmd_refresh_llms,
	cmd_open_new_llm,
	cmd_chat_first_llms,
	cmd_chat_every_llms,
	cmd_chat_with_target_tfile,
	cmd_chat_sequence,
	cmd_chat_sequence_stop,
	cmd_paste_last_active_llm,
	cmd_paste_ai_contents_as_list2tab,
	cmd_paste_ai_contents_as_list2card,
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