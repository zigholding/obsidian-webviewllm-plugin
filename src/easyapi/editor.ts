


import { App, View, WorkspaceLeaf,TFile } from 'obsidian';

import {EasyAPI} from 'src/easyapi/easyapi'

export class EasyEditor {
    app: App;
    api: EasyAPI;

    constructor(app: App, api:EasyAPI) {
        this.app = app;
        this.api = api;
    }
    
    async get_code_section(tfile:TFile,ctype='',idx=0,as_simple=true){
        let dvmeta = this.app.metadataCache.getFileCache(tfile);
        let ctx = await this.app.vault.cachedRead(tfile);
        let section = dvmeta?.sections?.filter(x=>x.type=='code').filter(x=>{
            let c = ctx.slice(x.position.start.offset,x.position.end.offset).trim();
            return c.startsWith('```'+ctype) || c.startsWith('~~~'+ctype);
        })[idx]
        if(section){
            let c = ctx.slice(
                section.position.start.offset,
                section.position.end.offset
            );
            
            if(as_simple){
                return c.slice(4+ctype.length,c.length-4)
            }else{
                let res = {
                    code:c,
                    section:section,
                    ctx:ctx
                }
                return res;
            }
        }
    }

    async get_heading_section(tfile:TFile,heading:string,idx=0){
        let dvmeta = this.app.metadataCache.getFileCache(tfile);
        let ctx = await this.app.vault.cachedRead(tfile);
        let section = dvmeta?.headings?.filter(x=>x.heading==heading)[idx]
        if(section){
            let c = ctx.slice(
                section.position.start.offset,
                section.position.end.offset
            );
            return c;
        }
    }
}

