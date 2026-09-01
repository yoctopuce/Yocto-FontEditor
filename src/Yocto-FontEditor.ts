/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  Entry point for the application
 *
 *   - - - - - - - - - License information: - - - - - - - - -
 *
 *  Copyright (C) 2026 and beyond by Yoctopuce Sarl, Switzerland.
 *
 *  Yoctopuce Sarl (hereafter Licensor) grants to you a perpetual
 *  non-exclusive license to use, modify, copy and integrate this
 *  file into your software for the sole purpose of interfacing
 *  with Yoctopuce products.
 *
 *  You may reproduce and distribute copies of this file in
 *  source or object form, as long as the sole purpose of this
 *  code is to interface with Yoctopuce products. You must retain
 *  this notice in the distributed source file.
 *
 *  You should refer to Yoctopuce General Terms and Conditions
 *  for additional information regarding your rights and
 *  obligations.
 *
 *  THE SOFTWARE AND DOCUMENTATION ARE PROVIDED "AS IS" WITHOUT
 *  WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
 *  WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, FITNESS
 *  FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO
 *  EVENT SHALL LICENSOR BE LIABLE FOR ANY INCIDENTAL, SPECIAL,
 *  INDIRECT OR CONSEQUENTIAL DAMAGES, LOST PROFITS OR LOST DATA,
 *  COST OF PROCUREMENT OF SUBSTITUTE GOODS, TECHNOLOGY OR
 *  SERVICES, ANY CLAIMS BY THIRD PARTIES (INCLUDING BUT NOT
 *  LIMITED TO ANY DEFENSE THEREOF), ANY CLAIMS FOR INDEMNITY OR
 *  CONTRIBUTION, OR OTHER SIMILAR COSTS, WHETHER ASSERTED ON THE
 *  BASIS OF CONTRACT, TORT (INCLUDING NEGLIGENCE), BREACH OF
 *  WARRANTY, OR OTHERWISE.
 */
// filesystem : caractère pour les les icon ne marche pas toujours
// filesystem écrans: delete marche pas
// Yfiles.isValidFilename(string) ?

// TODO  : import TTF : bold, italic, underline?
// TODO  : beware of refresh on color displays
// TODO  : Does font drawing on color displays even work ?
// TODO  : import TTF : autocorrect font size to land exactly on the asked pixel height value ?
import {Const} from "./constants.js";
import {YAPI, YErrorMsg, YModule} from "./yoctolib/yocto_api_html.js";
import {YFiles} from "./yoctolib/yocto_files.js";
import {CharacterSetRenderer, CharacterRenderer} from './characterRenderer.js';
import {CharacterEditor} from './editor.js';
import {CharacterChooser} from './chooser.js';
import {TextPreview} from './preview.js';
import {ExportFontUI} from './export.js';
import {WelcomePanel} from "./welcome.js";
import {TimeMachine} from "./timemachine.js";
import {ressources} from "./ressources.js";

export class WebApp
  {
    private readonly origin: string;
    private chooserContainer: HTMLDivElement;
    private editorContainer: HTMLDivElement;
    private previewContainer: HTMLDivElement;
    private exportContainer: HTMLDivElement;
    private welcomeContainer: HTMLDivElement;
    private charEditor: CharacterEditor | null = null;
    private charChooser: CharacterChooser | null = null;
    private preview: TextPreview | null = null
    private export: ExportFontUI | null = null
    private welcome: WelcomePanel | null = null

    constructor(hostname: string)
      {
        this.origin = hostname;
        this.chooserContainer = document.createElement("div")
        this.editorContainer = document.createElement("div")
        this.previewContainer = document.createElement("div")
        this.exportContainer = document.createElement("div")
        this.welcomeContainer = document.createElement("div")
        this.chooserContainer.style.position = "absolute"
        this.editorContainer.style.position = "absolute"
        this.previewContainer.style.position = "absolute"
        this.exportContainer.style.position = "absolute"
        this.editorContainer.style.borderLeft = "1px solid #d0d0d0"
        this.editorContainer.style.borderRight = "1px solid #d0d0d0"
        this.welcomeContainer.style.border = "1px solid black"
        this.welcomeContainer.style.position = "absolute";
        this.welcomeContainer.style.width = "700px";
        this.welcomeContainer.style.height = "520px";
        this.welcomeContainer.style.top = "50%";
        this.welcomeContainer.style.left = "50%";
        this.welcomeContainer.style.transform = "translate(-50%, -50%)"
      }

    private windowResized()
      {
        const minWidth: number = 700;
        const minHeight: number = 500;
        document.body.style.overflow = "hidden"
        let w: number = document.documentElement.clientWidth;
        let h: number = document.documentElement.clientHeight;
        if (w < minWidth) w = minWidth;
        if (h < minHeight) h = minHeight;
        let w1: number = Math.floor(30 * w / 100);
        let w3: number = w1;
        let w2: number = w - w1 - w3
        let h2: number = 175
        let h1: number = h - h2;
        this.chooserContainer.style.top = "0px"
        this.chooserContainer.style.left = "0px"
        this.chooserContainer.style.width = w1.toString() + "px"
        this.chooserContainer.style.height = h.toString() + "px"
        if (this.charChooser != null) this.charChooser.resized(w1, h)
        this.editorContainer.style.top = "0px"
        this.editorContainer.style.left = w1.toString() + "px"
        this.editorContainer.style.width = (w2 - 2).toString() + "px"  // border
        this.editorContainer.style.height = h.toString() + "px"
        if (this.charEditor != null) this.charEditor.resized(w2 - 2, h)
        this.previewContainer.style.top = "0px"
        this.previewContainer.style.left = (w1 + w2).toString() + "px"
        this.previewContainer.style.width = w3.toString() + "px"
        this.previewContainer.style.height = h1.toString() + "px"
        if (this.preview != null) this.preview.resized(w3, h1)
        this.exportContainer.style.top = h1.toString() + "px"
        this.exportContainer.style.left = (w1 + w2).toString() + "px"
        this.exportContainer.style.width = w3.toString() + "px"
        this.exportContainer.style.height = h2.toString() + "px"
        if (this.export != null) this.export.resized(w3, h2)
        if (this.charChooser != null) this.charChooser.set_headerHeigth((Const.ImgButtonSize + 18) * Math.ceil(this.charChooser.headerItemsCount / Math.floor(w1 / (Const.ImgButtonSize + 15))))
        if (this.charEditor != null) this.charEditor.set_headerHeigth((Const.ImgButtonSize + 18) * Math.ceil(this.charEditor.headerItemsCount / Math.floor(w2 / (Const.ImgButtonSize + 15))))
      }

    private showMainUI(fsSerial: string | null, filename: string | null)
      {
        if (this.welcome != null) this.welcome.visible = false;
        if (this.charChooser != null) this.charChooser.visible = true
        if (this.preview != null) this.preview.visible = true
        if (this.charEditor != null) this.charEditor.visible = true
        if (this.export != null)
          {
            this.export.show(fsSerial, filename);
            true
          }
      }

    private home()
      {
        if (this.welcome != null) this.welcome.visible = true;
        if (this.charChooser != null) this.charChooser.visible = false
        if (this.preview != null) this.preview.visible = false
        if (this.charEditor != null) this.charEditor.visible = false
        if (this.export != null) this.export.visible = false
      }

    private welcomeCanceled()
      {
        if (this.welcome != null) this.welcome.visible = false;
        if (this.charChooser != null) this.charChooser.visible = true
        if (this.preview != null) this.preview.visible = true
        if (this.charEditor != null) this.charEditor.visible = true
        if (this.export != null) this.export.visible = true
      }

    private async initDisplay(): Promise<void>
      {
        document.body.style.fontFamily = "Arial"
        let renderer: CharacterSetRenderer = new CharacterSetRenderer();
        //renderer.importFromFont("Courier New",16,1,255)
        let body = document.getElementById('body') as HTMLElement;
        body.appendChild(this.chooserContainer)
        body.appendChild(this.editorContainer)
        body.appendChild(this.previewContainer)
        body.appendChild(this.exportContainer)
        body.appendChild(this.welcomeContainer)
        this.charChooser = new CharacterChooser(this.chooserContainer, renderer, () => {this.home()}, (c: CharacterRenderer | null) => {if (this.charEditor) this.charEditor.edit(c)});
        this.preview = new TextPreview(this.previewContainer, this.charChooser)
        this.charEditor = new CharacterEditor(this.editorContainer, this.preview, this.charChooser)
        this.export = new ExportFontUI(this.exportContainer, this.charChooser)
        this.welcome = new WelcomePanel(this.welcomeContainer, this.charChooser, (selectedFontFsSerial: string | null, filename: string | null) => {this.showMainUI(selectedFontFsSerial, filename)}, () => {this.welcomeCanceled()})
        this.windowResized()
        window.addEventListener("resize", (_event: UIEvent) => { this.windowResized() })
        window.addEventListener("beforeunload", (event: BeforeUnloadEvent) => {return TimeMachine.ShouldSave(event) });
        await this.preview.refresh()
      }

    private async deviceArrival(m: YModule)
      {
        console.log("device arrival " + await m.get_serialNumber())
        if (this.preview != null) await this.preview.deviceArrival(m)
        if (this.export != null) await this.export.deviceArrival(m)
        if (this.welcome != null) await this.welcome.deviceArrival(m)
      }

    private async deviceRemoval(m: YModule)
      {
        console.log("device removal " + await m.get_serialNumber())
        if (this.preview != null) await this.preview.deviceRemoval(m)
        if (this.export != null) await this.export.deviceRemoval(m)
        if (this.welcome != null) await this.welcome.deviceRemoval(m)
      }

    public async run(): Promise<void>
      {
        document.title = Const.appName
        console.log("** welcome to Yoctopuce font editor **")
        let link: HTMLLinkElement = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
        link.href = ressources.favIcon()
        let errorMsg: YErrorMsg = new YErrorMsg()
        await this.initDisplay();
        YAPI._logLevel = 4;
        YAPI.SetNetworkTimeout(2500)
        await YAPI.RegisterLogFunction((line: string) => {console.log(line)})
        await YAPI.PreregisterHub(this.origin, errorMsg);
        await YAPI.PreregisterHub("127.0.0.1", errorMsg);
        await YAPI.RegisterDeviceArrivalCallback((m: YModule) => this.deviceArrival(m))
        await YAPI.RegisterDeviceRemovalCallback((m: YModule) => this.deviceRemoval(m))
        while (true)
          {
            await YAPI.UpdateDeviceList();
            await YAPI.Sleep(1000);
          }
      }
  }
