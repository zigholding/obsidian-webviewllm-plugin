export class Strings{
    language:string;
    constructor(){
        let lang = window.localStorage.getItem('language');
        if(lang){
            this.language = lang;
        }else{
            this.language = 'en';
        }
	}

    get cmd_refresh_llms(){
        if(this.language=='zh'){
            return '刷新AI模型列表'
        }else{
            return 'Refresh AI Models'
        }
    }

    get cmd_open_new_llm(){
        if(this.language=='zh'){
            return '新建AI对话'
        }else{
            return 'New AI Chat'
        }
    }

    get cmd_chat_sequence(){
        if(this.language=='zh'){
            return '开始连续对话'
        }else{
            return 'Start Continuous Chat'
        }
    }

    get cmd_chat_sequence_stop(){
        if(this.language=='zh'){
            return '停止连续对话'
        }else{
            return 'Stop Continuous Chat'
        }
    }

    get setting_prompt_name(){
        if(this.language=='zh'){
            return '提示词名称（用于标题或代码块）'
        }else{
            return 'Prompt Name (for heading or code block)'
        }
    }
    get setting_auto_stop(){
        if(this.language=='zh'){
            return '当AI返回以下文本时自动结束对话'
        }else{
            return 'Auto-stop chat when AI responds with'
        }
    }

    get cmd_chat_every_llms(){
        if(this.language=='zh'){
            return '向所有AI模型发送消息'
        }else{
            return 'Send Message to All AI Models'
        }
    }

    get cmd_chat_first_llms(){
        if(this.language=='zh'){
            return '向首个AI模型发送消息'
        }else{
            return 'Send Message to First AI Model'
        }
    }
}

export let strings = new Strings();