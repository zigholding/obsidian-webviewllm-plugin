
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
            return '刷新群组'
        }else{
            return 'Refresh llms';
        }
    }

    get cmd_open_new_llm(){
        if(this.language=='zh'){
            return '打开新AI'
        }else{
            return 'Open new llm';
        }
    }
}

export let strings = new Strings();