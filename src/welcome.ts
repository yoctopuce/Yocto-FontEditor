/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *   User interface welome panel, shown at application start
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
import {Button, TxtButton} from './button.js'
import {CharacterChooser} from './chooser.js';
import {YfmtFileHeader} from './characterRenderer.js';
import {YAPI, YErrorMsg, YModule, YHub} from './yoctolib/yocto_api.js';
import {YFiles, YFileRecord} from './yoctolib/yocto_files.js';
import {Const} from './constants.js';
import {CanvasMagnifier} from './canvasMagnifier.js';
import {ressources} from "./ressources.js";
import {BDFdecoder} from "./bdf_decoder.js";

type WelcomeCompletedCallback = (selectedFontFsSerial: string | null, filename: string | null) => void
type WelcomeCanceledCallback = () => void
type SelectionChanged = () => void

export class ttfFont
  {
    static InputID: number = 0
    private select: HTMLInputElement;
    private label: HTMLLabelElement;
    private name: string = "";
    static RenderingTestWidth  :number  = 50
    static RenderingTestHeight :number  = 16
    static refFontCanvas : HTMLCanvasElement | null = null;
    static refFontCanvasCtx : CanvasRenderingContext2D | null = null;
    static refPixels :ImageData |null = null;
    static Signature : string = "Démg%!"
    static FontList : HTMLLabelElement[] =  []

    private static  testFontProperRendering(fontname:string):boolean
    {
      if (fontname=="Times New Roman") return true;  // FireFox default font.
      if  (!ttfFont.refFontCanvasCtx)
      {
        ttfFont.refFontCanvas        = document.createElement("canvas")
        ttfFont.refFontCanvas.width  = ttfFont.RenderingTestWidth;
        ttfFont.refFontCanvas.height = ttfFont.RenderingTestHeight;
        ttfFont.refFontCanvas.style.backgroundColor = "white";


        ttfFont.refFontCanvasCtx = ttfFont.refFontCanvas.getContext("2d", {willReadFrequently: true})
        if  (ttfFont.refFontCanvasCtx)
        { ttfFont.refFontCanvasCtx.textBaseline = "top"
          ttfFont.refFontCanvasCtx.font = ttfFont.RenderingTestHeight.toString()+"px FAKEfOnt"
          ttfFont.refFontCanvasCtx.fillStyle = "black";
          ttfFont.refFontCanvasCtx.fillText(ttfFont.Signature, 0, 0);
          //document.body.appendChild(ttfFont.refFontCanvas)
          ttfFont.refPixels = ttfFont.refFontCanvasCtx.getImageData(0, 0, ttfFont.RenderingTestWidth, ttfFont.RenderingTestHeight)
        }
      }
      if (!ttfFont.refFontCanvasCtx)  return false
      if  (ttfFont.refPixels)
      {  ttfFont.refFontCanvasCtx.clearRect(0, 0, ttfFont.RenderingTestWidth, ttfFont.RenderingTestHeight);
         ttfFont.refFontCanvasCtx.font = ttfFont.RenderingTestHeight.toString()+"px "+fontname
         ttfFont.refFontCanvasCtx.fillText(ttfFont.Signature, 0, 0);
         let pixels : ImageData  = ttfFont.refFontCanvasCtx.getImageData(0, 0, ttfFont.RenderingTestWidth, ttfFont.RenderingTestHeight)
         for (let i:number =0;i< pixels.data.byteLength;i++)
           if (pixels.data[i] != ttfFont.refPixels.data[i]) return true;
      }
        return false
    }


    constructor(fontName: string, onchange: SelectionChanged)
      {
        YFileFont.InputID++;
        let id: string = "ttfFonName" + YFileFont.InputID
        this.name = fontName;
        this.select = document.createElement("input")
        this.select.type = "radio"
        this.select.name = "yFileFont"
        this.select.id = id
        this.select.value = id
        this.select.style.marginLeft = "10px"

        if (this.name == "Arial") this.select.checked = true  // Arial is supposed to be a Web safe font
        this.label = document.createElement("label");
        this.label.htmlFor = id
        this.label.innerText = this.name = fontName
        ttfFont.FontList.push(this.label)

        this.label.style.fontSize = "20px"
        this.select.addEventListener("change", () => {onchange()})
      }
    // used to perform font list rendering progressively,
    static  StartFontRendering()
    {  for (let i:number =0;i<10;i++)
        { if  (ttfFont.FontList.length<=0) return
          let l : HTMLLabelElement = ttfFont.FontList[0];
          ttfFont.FontList.splice(0, 1);
          let fontname :string  = l.innerText;
          l.style.fontFamily = fontname
          if (! ttfFont.testFontProperRendering(fontname))
           { l.style.color = "LightGray" ;
            l.title ="Your browser blocked the renderering of '"+fontname+"' font. It might beleive this is  part of a fingerprinting scheme. You can either disable this security feature for this page, or use another browser. "
          }
        }
      if  (ttfFont.FontList.length>0) requestAnimationFrame((id)=>ttfFont.StartFontRendering())

    }

    public get fontName(): string { return this.name }

    public get selected(): boolean { return this.select.checked }

    public get checkBoxElement(): HTMLInputElement { return this.select }

    public get labelElement(): HTMLLabelElement { return this.label }
  }

export class YFileFont
  {
    static InputID: number = 0
    private select: HTMLInputElement;
    private label: HTMLLabelElement;
    private source: YFiles
    private sourceSerial: string
    private sourceFriendlyName: string
    private flag: boolean = false;
    private filename: string
    private TR: HTMLTableRowElement;

    constructor(source: YFiles, serial: string, friendlyName: string, filename: string, size: number, onchange: SelectionChanged)
      {
        YFileFont.InputID++;
        let id: string = "fontfile" + YFileFont.InputID
        this.source = source;
        this.sourceSerial = serial;
        this.sourceFriendlyName = friendlyName;
        this.filename = filename;
        this.TR = document.createElement("tr")
        let TD: HTMLTableCellElement = document.createElement("td")
        this.select = document.createElement("input")
        this.select.type = "radio"
        this.select.name = "yFileFont"
        this.select.id = id
        this.select.value = id
        this.select.style.marginLeft = "20px"
        this.label = document.createElement("label");
        this.label.htmlFor = id
        this.label.innerHTML = "<tt>" + filename + "</tt>"
        this.select.addEventListener("change", () => {onchange()})
        TD.appendChild(this.select)
        TD.appendChild(this.label)
        this.TR.appendChild(TD)
        // file size
        TD = document.createElement("td")
        TD.innerHTML = "<tt>" + (Math.round(size * 10 / 1024) / 10) + " KB</tt>"
        this.TR.appendChild(TD)
        // host
        TD = document.createElement("td")
        TD.innerHTML = "<tt>" + friendlyName + "</tt>"
        this.TR.appendChild(TD)
      }

    public get flagged(): boolean {return this.flag}

    public set flagged(value: boolean) { this.flag = value}

    public get fileSystem(): YFiles {return this.source}

    public get fileSystemSerial(): string {return this.sourceSerial}

    public get friendlyName(): string { return this.sourceFriendlyName }

    public get fontFilename(): string { return this.filename }

    public get chosen(): boolean
      {
        if (this.checkBoxElement.disabled) return false
        return this.checkBoxElement.checked
      }

    public set enabled(value: boolean)
      {
        this.select.disabled = !value
        if (value)
          {
            this.label.title = "";
            this.label.style.textDecoration = ""
          } else
          {
            this.select.checked = false
            this.label.style.textDecoration = "line-through";
            this.label.title = "file " + this.filename + " isn't available anymore";
          }
      }

    public get checkBoxElement(): HTMLInputElement { return this.select }

    public get labelElement(): HTMLLabelElement { return this.label }

    public get htmlElement(): HTMLTableRowElement { return this.TR }

    public isSameSame(serial: string, filename: string): boolean
      {
        return (this.filename == filename) && (this.sourceSerial == serial)
      }
  }

export class WelcomePanel
  {
    private charCollection: CharacterChooser;
    private welcomeCompleted: WelcomeCompletedCallback;
    private welcomeCancelled: WelcomeCanceledCallback;
    private container: HTMLDivElement
    private fromScratch: HTMLInputElement;
    private loadFileFromYfile: HTMLInputElement;
    private loadFileFromLocalFileSystem: HTMLInputElement;
    private ImportTtfFont: HTMLInputElement;
    private  ImportBdfFont: HTMLInputElement;
    private activeDiv: HTMLDivElement;
    private loadResultDiv: HTMLDivElement;
    private bdfList : BDFdecoder[]   = [];
    private currentBdfFont: BDFdecoder | null = null
    private bdfChooserCells : HTMLCanvasElement[]   = [];

    private scratchDiv: HTMLDivElement;
    private yfileDiv: HTMLDivElement;
    private localfsDiv: HTMLDivElement;
    private bdfDiv: HTMLDivElement;
    private bdfTable : HTMLTableElement
    private sampleUI: HTMLParagraphElement
    private bdfsampleText : HTMLInputElement
    private bdfSampleCanvas : HTMLCanvasElement
    private bdfError: HTMLParagraphElement
    private bdfCopyright : HTMLParagraphElement

    private bdfFontList: HTMLDivElement

    private ttfDiv: HTMLDivElement;
    private scratchFirstChar: HTMLInputElement
    private scratchLastChar: HTMLInputElement
    private scratchCharWidth: HTMLInputElement
    private scratchCharHeight: HTMLInputElement
    private yfileHubIpAddress: HTMLInputElement
    private yfileFileList: HTMLTableElement
    private yfileFileListContainer: HTMLDivElement
    private localfsFile: HTMLInputElement
    private bdfFile: HTMLInputElement
    private fontListHeader: HTMLParagraphElement
    private connectError: HTMLParagraphElement
    private yFileFonts: YFileFont[] = []
    private dataLoadedFromLocalFs: Uint8Array | null = null
    private dataLoadedFromLocalFsFilename: string = "";
    private letGoBtn: TxtButton
    private cancelBtn: TxtButton
    private connectButton: TxtButton
    private virtualHubIsPresent: boolean = false
    private availableTTfFonts: ttfFont[] = [];
    private ttfFontSize: HTMLInputElement | null = null
    private ttfFontSample: HTMLInputElement | null = null
    private ttfFirstChar: HTMLInputElement | null = null
    private ttfLastChar: HTMLInputElement | null = null
    private ttfFontAntiAliasControl: HTMLInputElement | null = null
    private ttfFillAndStroke: HTMLSelectElement | null = null
    private ttfOutlineWidth: HTMLInputElement | null = null
    private ttfFontDemo: HTMLCanvasElement | null = null;
    private ttfFontDemoCtx: CanvasRenderingContext2D | null = null;
    private ttfDemoInternalcanvas: HTMLCanvasElement | null = null;
    private ttfDemoInternalcanvasCtx: CanvasRenderingContext2D | null = null;
    private ttfDemoOngoingRefresh: NodeJS.Timeout | null = null;
    private ttfDemoOngoingRefreshRunning: boolean = false;
    private ttfDemoOngoingRefreshMustRunAgain: boolean = false;
    private magnifier: CanvasMagnifier | null = null
    private static BadInputColor: string = Const.BadInputBgColor;
    private static noYfmFileMsg: string = ressources.smallWarningIcon() + "&nbsp;" + "There is no .yfm font file available, connect to a hub";

    private requiresVirtualHubMsg(badversion:boolean=false,badBuild:boolean=false)
    { return   "This feature requires a VirtualHub "
             + (badversion?"<b>":"") +"V2"+ (badversion?"</b>":"")
             + ", "+  (badBuild?"<b>":"") +"at least version 2.1.14003"+ (badBuild?"</b>":"")
             + ", running on the local machine"
    }
    constructor(container: HTMLDivElement, charCollection: CharacterChooser, welcomeCompleted: WelcomeCompletedCallback, welcomeCancelled: WelcomeCanceledCallback)
      {
        this.charCollection = charCollection;
        this.container = container
        this.welcomeCompleted = welcomeCompleted;
        this.welcomeCancelled = welcomeCancelled
        this.container.style.backgroundColor = Const.WelcomePanelBgColor;
        let p: HTMLParagraphElement = document.createElement("p");
        let img: HTMLDivElement = document.createElement("div");
        img.innerHTML = ressources.appIcon()
        img.style.display = "inline"
        img.style.float = "left"
        img.style.marginRight = "5px"
        p.appendChild(img)
        p.innerHTML += "Welcome to Yoctopuce's font editor, this application is meant to help you create <i>.yfm</i> font files for use on Yoctopuce displays. What would you like to do today?<br><br>";
        p.style.textAlign = "justify"
        p.style.margin = "10px 10px 10px 10px"
        this.container.appendChild(p)
        this.fromScratch = this.AddOption('scratch', "Create a new font from scratch")
        this.loadFileFromYfile = this.AddOption('yfile', "Edit a .yfm font file from a Yoctopuce filesystem")
        this.loadFileFromLocalFileSystem = this.AddOption("localfs", "Edit a .yfm font file from the local filesystem")
        this.ImportBdfFont = this.AddOption("bdf", "Import a BDF font from local computer")
        this.ImportTtfFont = this.AddOption("ttf", "Import a TrueType font from local computer")
        this.activeDiv = document.createElement('div')
        this.activeDiv.style.marginLeft = "40px";
        this.container.appendChild(this.activeDiv);
        /*
         version
         */
        let version: HTMLDivElement = document.createElement("div");
        version.style.position = "absolute"
        version.style.left = "3px"
        version.style.bottom = "3px"
        version.style.fontSize = "smaller"
        version.style.color = "#808080"
        version.innerText = Const.version
        this.container.appendChild(version)
        /*
         font from scratch
         */
        this.scratchDiv = document.createElement('div')
        this.scratchDiv.style.display = "none"
        let table: HTMLTableElement = document.createElement("table")
        this.scratchFirstChar = this.addByteParameter(table, "First character ASCII code", '32')
        this.scratchLastChar = this.addByteParameter(table, "Last character ASCII code", '126')
        this.scratchCharWidth = this.addByteParameter(table, "Characters average width", '8')
        this.scratchCharHeight = this.addByteParameter(table, "Characters height", '12')
        this.scratchDiv.appendChild(table)
        this.activeDiv.appendChild(this.scratchDiv);
        /*
         font from Yoctopuce file system
         */
        this.yfileDiv = document.createElement('div')
        this.yfileDiv.style.display = "none"
        this.activeDiv.appendChild(this.yfileDiv);
        p = document.createElement("p")
        p.innerText = "Optionnally, you can connect to a Yocthub to access filesystem of devices connected to this hub"
        this.yfileDiv.appendChild(p)
        this.connectButton = new TxtButton("Connect", "Establish connection to YoctoHub", () => {this.connect()})
        this.connectButton.enabled = false;
        table = document.createElement("table")
        table.style.marginLeft = "30px"
        this.connectError = document.createElement("p")
        this.connectError.style.display = "none"
        this.yfileHubIpAddress = this.addIPParameter(table, "Hub IP address", this.connectButton, this.connectError)
        this.yfileDiv.appendChild(table)
        //this.yfileDiv.appendChild(this.connectError)
        this.fontListHeader = document.createElement("p")
        this.fontListHeader.innerHTML = WelcomePanel.noYfmFileMsg
        this.yfileDiv.appendChild(this.fontListHeader)
        this.yfileFileListContainer = document.createElement("div")
        this.yfileFileListContainer.style.backgroundColor = "white"
        this.yfileFileListContainer.style.marginRight = "10px"
        this.yfileFileListContainer.style.border = "1px solid black"
        this.yfileFileListContainer.style.width = "630px"
        this.yfileFileListContainer.style.height = "150px"
        this.yfileFileListContainer.style.overflowY = "scroll"
        this.yfileFileList = document.createElement("table")
        this.yfileFileList.style.width = "100%"
        let TR: HTMLTableRowElement = document.createElement("tr")
        TR.style.backgroundColor = Const.headerBgColor;
        let th: HTMLTableHeaderCellElement = document.createElement("th")
        th.innerText = "Font file"
        th.style.width = "50%"
        TR.appendChild(th);
        th = document.createElement("th")
        th.innerText = "Size"
        th.style.width = "20%"
        TR.appendChild(th);
        th = document.createElement("th")
        th.innerText = "File system"
        th.style.width = "30%"
        TR.appendChild(th);
        this.yfileFileList.appendChild(TR)
        this.yfileFileListContainer.appendChild(this.yfileFileList)
        this.yfileDiv.appendChild(this.yfileFileListContainer)
        /*
         font from local file systems
         */
        this.localfsDiv = document.createElement('div')
        this.localfsDiv.style.display = "none"
        p = document.createElement("p")
        p.innerText = "Choose a .yfm file from your local computer "
        this.localfsDiv.appendChild(p)
        this.localfsFile = document.createElement("input")
        // @ts-ignore
        this.localfsFile.type = "file"
        this.localfsFile.accept = '.yfm';
        this.localfsFile.id = "localfileChooser"
        // this.localfsFile.style.display="none"
        this.localfsFile.addEventListener("change", async () => { await this.loadFromLocalfs(); })
        this.localfsDiv.appendChild(this.localfsFile)
        this.activeDiv.appendChild(this.localfsDiv);

        /*
         BDF font from local file systms
         */
        this.bdfDiv = document.createElement('div')
        this.bdfDiv.style.display = "none"
        p = document.createElement("p")
        p.innerText = "Import a Glyph Bitmap Distribution Format (BDF) font from local file system, choose one or more  BDF files: "
        this.bdfDiv.appendChild(p)
        this.bdfFile = document.createElement("input")
        this.bdfFile.type = "file"
        this.bdfFile.accept = '.bdf';
        this.bdfFile.id = "bdfChooser"
        this.bdfFile.multiple=true
        this.bdfFile.addEventListener("change", async () => { await this.loadBdfFiles(); })
        p.appendChild(this.bdfFile)
        this.bdfTable = document.createElement('table')
        let tr : HTMLTableRowElement  = document.createElement('tr')
        let td : HTMLTableCellElement = document.createElement('td')
        this.bdfFontList  = document.createElement('div')
        this.bdfFontList.style.backgroundColor="white"
        this.bdfFontList.style.width="200px"
        this.bdfFontList.style.height="200px"
        this.bdfFontList.style.overflowX="hidden"
        this.bdfFontList.style.overflowY="auto"
        this.bdfFontList.style.whiteSpace="nowrap"
        this.bdfFontList.style.border="1px solid black"
        td.appendChild(this.bdfFontList )
        tr.appendChild(td)
        td  = document.createElement('td')
        td.style.verticalAlign="top"
        this.sampleUI  = document.createElement("p")
        this.sampleUI.style.marginLeft="10px"
        this.sampleUI.innerText="Type some sample text:"
        this.bdfsampleText  =  document.createElement('input')
        this.bdfsampleText.value= Const.DemoText;
        this.bdfsampleText.addEventListener("input",()=>{ this.bdfPreview()})
        this.sampleUI.appendChild(this.bdfsampleText)
        this.bdfSampleCanvas =  document.createElement('canvas')
        this.bdfSampleCanvas.width=420;
        this.bdfSampleCanvas.height=96;
        this.bdfSampleCanvas.style.marginTop="5px";
        this.bdfSampleCanvas.style.border="1px solid black"
        this.bdfSampleCanvas.style.backgroundColor="white"
        this.bdfSampleCanvas.style.display="";
        new CanvasMagnifier(this.bdfSampleCanvas)
        this.sampleUI.appendChild(this.bdfSampleCanvas)
        this.bdfCopyright = document.createElement('p')
        this.bdfCopyright.style.fontSize="smaller"
        this.bdfCopyright.style.color ="darkgray"
        this.bdfCopyright.style.textAlign =   "justify"
        this.bdfCopyright.style.paddingLeft ="20px"
        this.bdfCopyright.style.paddingRight ="20px"
        this.bdfCopyright.style.verticalAlign ="top"
        this.sampleUI.appendChild(this.bdfCopyright)
        td.appendChild(this.sampleUI)
        this.bdfError = document.createElement('p')
        this.bdfError.style.display="";
        this.bdfError.style.paddingLeft="10px";
        this.bdfError.style.paddingRight="10px";
        this.bdfError.style.textAlign="justify"
        td.appendChild(this.bdfError)
        tr.appendChild(td)
        this.bdfTable.appendChild(tr)
        this.bdfTable.style.display="none"
        this.bdfDiv.appendChild(this.bdfTable)
        this.activeDiv.appendChild(this.bdfDiv);

        /*
         font from local TTF font
         */
        this.ttfDiv = document.createElement('div')
        this.ttfDiv.style.display = "none"
        this.ttfDiv.innerHTML = "<br>"+this.requiresVirtualHubMsg()
        this.activeDiv.appendChild(this.ttfDiv);
        this.container.appendChild(this.activeDiv)
        this.loadResultDiv = document.createElement("div")
        this.loadResultDiv.style.paddingTop = "20px"
        this.loadResultDiv.style.display = "none"
        this.loadResultDiv.style.marginLeft = "50px"
        this.container.appendChild(this.loadResultDiv)
        this.cancelBtn = new TxtButton("Cancel", "Go back to the font editor", (src: Button) => {this.welcomeCancelled()})
        this.cancelBtn.visible = false;
        this.letGoBtn = new TxtButton("Start editor", "Launch the font editor", (src: Button) => {this.startEditor()})
        let btnContainer: HTMLDivElement = document.createElement('div');
        btnContainer.style.position = "absolute"
        btnContainer.style.right = "3px"
        btnContainer.style.bottom = "3px"
        btnContainer.style.textAlign = "right"
        btnContainer.appendChild(this.cancelBtn.htmlelement);
        btnContainer.appendChild(this.letGoBtn.htmlelement);
        this.container.appendChild(btnContainer)
        this.letGoBtn.enabled = false
      }

    private checkRange(input1: HTMLInputElement, inputDesc1: string, input2: HTMLInputElement | null, inputDesc2: string | null, minValue: number, maxValue: number): boolean
      {
        let value1: number = parseInt(input1.value)
        let err: string = "";
        if (isNaN(value1)) err = inputDesc1 + " should be an integer";
        if (value1 < minValue) err = inputDesc1 + " should be greater or equal to " + minValue
        if (value1 > maxValue) err = inputDesc1 + " should be less or equal to " + maxValue
        input1.title = err;
        input1.style.backgroundColor = err != "" ? WelcomePanel.BadInputColor : ""
        if (err != "") return false
        if (input2 == null) return true
        if (inputDesc2 == null) inputDesc2 = "";
        let value2: number = parseInt(input2.value)
        if (isNaN(value2)) err = inputDesc2 + " should be an integer";
        if (value2 < minValue) err = inputDesc2 + " should be greater or equal to " + minValue
        if (value2 > maxValue) err = inputDesc2 + " should be less or equal to " + maxValue
        if (err == "")
          {
            if ((value1 > value2))
              {
                err = inputDesc2 + " should be greater or equal to " + inputDesc1
                input1.title = err;
                input1.style.backgroundColor = WelcomePanel.BadInputColor
                input2.title = err;
                input2.style.backgroundColor = WelcomePanel.BadInputColor
                return false
              } else
              {
                input1.title = "";
                input1.style.backgroundColor = "";
                input2.title = "";
                input2.style.backgroundColor = "";
                return true
              }
          }
        input2.title = err;
        input2.style.backgroundColor = WelcomePanel.BadInputColor
        return false
      }

    private onBdfFontSelected (font: BDFdecoder | null)
      { this.currentBdfFont = null
        if (font)
          {let err :string = font.errorMsg();
            if (err=="")
              {
                this.sampleUI.style.display="";
                this.bdfError.style.display="none";

                this.currentBdfFont = font
                this.bdfPreview()
              }
            else
              {
                this.sampleUI.style.display="none";
                this.bdfError.style.display="";
                this.bdfError.innerHTML =  ressources.smallWarningIcon() + "&nbsp; Cannot use  file <b>" + font.getFilename()+"</b> : " + err
                this.bdfCopyright.innerText = "";

              }


          }
        this.sanityCheck()
      }

    private bdfloadCompleted(event: ProgressEvent<FileReader>,filename:string)
      {
        if (event.target != null) if (event.target.result != null)
        {

          let decoder :TextDecoder=   new TextDecoder("utf-8");
          let  data :string = decoder.decode(event.target.result as ArrayBuffer)
          let font :BDFdecoder  = new BDFdecoder()
          font.parse(data,filename)
          this.bdfList.push(font)
          let c :HTMLCanvasElement = document.createElement("canvas")
          c.title= filename;
          font.drawDemo(c)
          c.style.display="inline"
          c.style.verticalAlign="middle"

          let input:HTMLInputElement = document.createElement("input")
          input.type = "radio"
          input.id   = filename
          input.name = "BDFfile"
          input.value= filename
          input.addEventListener("change",()=>{this.onBdfFontSelected(font)})
          let label : HTMLLabelElement = document.createElement("label")
          label.htmlFor = input.id
          label.appendChild(c)
          this.bdfFontList.appendChild(input)
          this.bdfFontList.appendChild(label)
          this.bdfFontList.appendChild(document.createElement("br"))
          if (this.bdfList.length==1)
            { input.checked=true
              this.onBdfFontSelected(font)
            }
          this.bdfFontList.style.display= (this.bdfList.length>1) ? "" : "none"

          this.bdfTable.style.paddingLeft=(this.bdfList.length>1) ? "0px" : "100px"

        }
        this.sanityCheck()

      }
    private  bdfPreview()
      { if (! this.currentBdfFont) return;
        this.currentBdfFont.previewFont(this.bdfSampleCanvas, this.bdfsampleText.value)
        this.bdfCopyright.style.textAlign = (this.currentBdfFont.getCopyright().length > 60) ? "justify" : "right"
        this.bdfCopyright.innerText = this.currentBdfFont.getCopyright()
      }


    private loadCompleted(event: ProgressEvent<FileReader>)
      {
        if (event.target != null) if (event.target.result != null)
          {
            this.dataLoadedFromLocalFs = new Uint8Array(event.target.result as ArrayBuffer);
            let header: YfmtFileHeader = new YfmtFileHeader(this.dataLoadedFromLocalFs);
            if (header.fileOk)
              {
                this.showloadResult("Font file <b>" + this.dataLoadedFromLocalFsFilename + "</b> loaded successully, click on the <i>start editor</i> button.", false)
              } else
              {
                this.dataLoadedFromLocalFs = null
                this.showloadResult("Cannot use  file <b>" + this.dataLoadedFromLocalFsFilename + "</b> :" + header.error, true)
              }
            this.sanityCheck()
          }
      }

   private async loadBdfFiles()
    { this.showloadResult("", false);
      this.bdfTable.style.display=""


      this.bdfList = []
      while (this.bdfFontList.firstChild)  { // @ts-ignore
        this.bdfFontList.removeChild(this.bdfFontList.lastChild);
      }
      // @ts-ignore
      let files: File[] = this.bdfFile.files;

      if (files)
        {for (let i=0;i<files.length;i++)
          {
            let reader = new FileReader();
            this.dataLoadedFromLocalFsFilename = files[i].name
            reader.addEventListener("loadend", (event: ProgressEvent<FileReader>) => { this.bdfloadCompleted(event, files[i].name) })
            await reader.readAsArrayBuffer(files[i]);
          }
        }

    }

    private async loadFromLocalfs()
      {
        this.showloadResult("", false);
        // @ts-ignore
        let files: File[] = this.localfsFile.files;
        if (files)
          {
            let reader = new FileReader();
            this.dataLoadedFromLocalFsFilename = files[0].name
            reader.addEventListener("loadend", (event: ProgressEvent<FileReader>) => { this.loadCompleted(event) })
            reader.readAsArrayBuffer(files[0]);
          }
      }

    private showloadResult(msg: string, isError: boolean)
      {
        if (isError) this.loadResultDiv.innerHTML = ressources.smallWarningIcon() + "&nbsp;" + msg; else this.loadResultDiv.innerHTML = ressources.smallInfoIcon() + "&nbsp;" + msg;
        this.loadResultDiv.style.display = msg == "" ? "none" : ""
      }



    private chosenYFontFile(): YFileFont | null
      {
        for (let i: number = 0; i < this.yFileFonts.length; i++) if (this.yFileFonts[i].chosen) return this.yFileFonts[i];
        return null
      }

    private async refreshYfsFontList()
      {
        for (let i: number = 0; i < this.yFileFonts.length; i++) this.yFileFonts[i].flagged = false
        let fs: YFiles | null = YFiles.FirstFiles()
        while (fs != null)
          {
            let list: YFileRecord[] = await fs.get_list("*.yfm");
            let serial = await fs.get_serialNumber()
            let friendly = await fs.get_friendlyName()
            for (let i: number = 0; i < list.length; i++)
              {
                let size: number = list[i].get_size()
                let filename: string = list[i].get_name();
                let foundIndex: number = -1;
                for (let j: number = 0; j < this.yFileFonts.length; (j++) && (foundIndex < 0)) if (this.yFileFonts[j].isSameSame(serial, filename))
                  {
                    foundIndex = j;
                    this.yFileFonts[j].flagged = true
                  }
                if (foundIndex < 0)
                  {
                    let f: YFileFont = new YFileFont(fs, serial, friendly, filename, size, () => {this.sanityCheck()})
                    f.flagged = true
                    this.yfileFileList.appendChild(f.htmlElement)
                    this.yFileFonts.push(f)
                  }
              }
            fs = fs.nextFiles()
          }
        for (let i: number = 0; i < this.yFileFonts.length; i++) this.yFileFonts[i].enabled = this.yFileFonts[i].flagged
        if (this.yFileFonts.length > 0)
          {
            this.fontListHeader.innerText = "Here is the list of fonts files found on various filesystems, choose the one you want to load"
            this.yfileFileListContainer.style.display = "";
          } else
          {
            this.fontListHeader.innerHTML = WelcomePanel.noYfmFileMsg;
            this.yfileFileListContainer.style.display = "None";
          }
        this.sanityCheck();
      }

    private selectedTtfFont(): ttfFont | null
      {
        for (let i: number = 0; (i < this.availableTTfFonts.length); i++) if (this.availableTTfFonts[i].selected) return this.availableTTfFonts[i]
        return null
      }

    private async refreshTtfFontList()
      {
        let virtualHubUrl: string = "";
        let virtualSerial: string = "";
        let virtualHubFound: boolean = false;
        if (this.virtualHubIsPresent) return;
        // search for a local VirtualHub V2 with active connection
        let h = YHub.FirstHubInUse()
        while (h != null)
          {
            if (h.get_connectionState() == YHub.CONNECTED) if (h.get_serialNumber().startsWith("VIRTHUB"))
              {
                let urls: string[] = h.get_knownUrls()
                for (let i: number = 0; i < urls.length; i++)
                  {
                    if (urls[i].indexOf("127.0.0.1") >= 0)
                      { virtualSerial = h.get_serialNumber()
                        virtualHubUrl = h.get_connectionUrl();
                        virtualHubFound = true
                      }
                  }
              }
            h = h.nextHubInUse()
          }
        if (!virtualHubFound) return;
        if  (!virtualSerial.startsWith("VIRTHUB2"))
        {
          this.ttfDiv.innerHTML = "<br>"+this.requiresVirtualHubMsg(true)
          return
        }
        let m :YModule = YModule.FindModule(virtualSerial+".module")
        let firmware :number = parseInt(await m.get_firmwareRelease())
        if (!isNaN(firmware))
           if (firmware<74003)
           { this.ttfDiv.innerHTML = "<br>"+this.requiresVirtualHubMsg(false,true)
             return
           }

        // get font list
        virtualHubUrl = virtualHubUrl.replace("ws:", "http:")
        console.log(virtualHubUrl)
        let response: Response = await fetch(virtualHubUrl + "fonts.txt");
        if (!response.ok)
          {
            console.log("Cannot download font list from " + virtualHubUrl + " (" + response.status + ")");
            return;
          }
        const contents = await response.text();
        let lines: string[] = contents.split("\n");
        lines.sort()
        let AvailableFontNames: string[] = [];
        for (let i: number = 0; i < lines.length; i++) if (lines[i] != "") this.availableTTfFonts.push(new ttfFont(lines[i].trim(), () => {this.sanityCheck()}))
        console.log(lines.length + " fonts found");
        this.ttfDiv.innerHTML = "";
        let table: HTMLTableElement = document.createElement("table")
        let tr: HTMLTableRowElement = document.createElement("tr")
        let td: HTMLTableCellElement = document.createElement("td")
        td.rowSpan = 5;
        let listContainer: HTMLDivElement = document.createElement("div")
        listContainer.style.overflowY = "auto"
        listContainer.style.overflowX = "hidden"
        listContainer.style.maxHeight = "250px"
        listContainer.style.maxWidth = "250px"
        listContainer.style.whiteSpace = "nowrap"
        listContainer.style.backgroundColor = "white"
        listContainer.style.border = "1px solid black"
        for (let i: number = 0; i < this.availableTTfFonts.length; i++)
          {
            listContainer.appendChild(this.availableTTfFonts[i].checkBoxElement);
            listContainer.appendChild(this.availableTTfFonts[i].labelElement);
            listContainer.appendChild(document.createElement("br"));
          }
        ttfFont.StartFontRendering(); // background rendering of font list
        td.appendChild(listContainer);
        tr.appendChild(td);
        td = document.createElement("td")
        td.style.textAlign = "right"
        td.innerText = "Size:"
        tr.appendChild(td);
        td = document.createElement("td")
        this.ttfFontSize = document.createElement("input")
        this.ttfFontSize.size = 3;
        this.ttfFontSize.maxLength = 3;
        this.ttfFontSize.value = "16";
        this.ttfFontSize.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfFontSize)
        tr.appendChild(td);
        td = document.createElement("td")
        td.colSpan=2
        td.style.textAlign = "right"
        td.innerText = "Import from #"

        tr.appendChild(td);
        td = document.createElement("td")
        this.ttfFirstChar = document.createElement("input")
        this.ttfFirstChar.size = 3;
        this.ttfFirstChar.maxLength = 3;
        this.ttfFirstChar.value = "32";
        this.ttfFirstChar.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfFirstChar)
        tr.appendChild(td);
        td = document.createElement("td")
        td.style.textAlign = "right"
        td.innerText = "to"
        tr.appendChild(td);
        td = document.createElement("td")
        this.ttfLastChar = document.createElement("input")
        this.ttfLastChar.size = 3;
        this.ttfLastChar.maxLength = 3;
        this.ttfLastChar.value = "126";
        this.ttfLastChar.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfLastChar)
        tr.appendChild(td);
        table.appendChild(tr)
        tr = document.createElement("tr")
        td = document.createElement("td")
        td.innerText="Draw:"
        td.style.textAlign = "right"
        tr.appendChild(td)
        td = document.createElement("td")
        td.style.textAlign = "right"
        this.ttfFillAndStroke = document.createElement("select")
        let option: HTMLOptionElement = document.createElement("option");
        option.setAttribute("value", "1");
        option.innerHTML = "Fill only";
        this.ttfFillAndStroke.appendChild(option);
        option = document.createElement("option");
        option.setAttribute("value", "2");
        option.innerHTML = "Stroke only";
        this.ttfFillAndStroke.appendChild(option);
        option = document.createElement("option");
        option.setAttribute("value", "3");
        option.innerHTML = "Fill+Stroke";
        this.ttfFillAndStroke.appendChild(option);
        this.ttfFillAndStroke.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfFillAndStroke);
        tr.appendChild(td);
        td = document.createElement("td")
        td.style.textAlign="right"
        td.innerText="Stroke width:"
        tr.appendChild(td)
        td = document.createElement("td")
        td.colSpan = 4
        this.ttfOutlineWidth = document.createElement("input")
        this.ttfOutlineWidth.type = "range"
        this.ttfOutlineWidth.min = "5";
        this.ttfOutlineWidth.max = "100";
        this.ttfOutlineWidth.value = "10"
        this.ttfOutlineWidth.style.width="120px"
        this.ttfOutlineWidth.disabled = true;
        this.ttfOutlineWidth.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfOutlineWidth)
        tr.appendChild(td);
        table.appendChild(tr)
        tr = document.createElement("tr")
        td = document.createElement("td")
        td.colSpan = 3
        td.style.textAlign = "right"
        td.innerText = "Anti-anti-aliasing filter:"
        tr.appendChild(td);
        td = document.createElement("td")
        td.colSpan = 4;
        this.ttfFontAntiAliasControl = document.createElement("input")
        this.ttfFontAntiAliasControl.type = "range"
        this.ttfFontAntiAliasControl.min = "1";
        this.ttfFontAntiAliasControl.max = "255";
        this.ttfFontAntiAliasControl.style.width="120px"
        this.ttfFontAntiAliasControl.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfFontAntiAliasControl)
        tr.appendChild(td);
        table.appendChild(tr)
        tr = document.createElement('tr')
        td = document.createElement("td")
        td.colSpan = 2
        td.style.textAlign = "Right"
        td.innerText = "Text sample:"
        tr.appendChild(td);
        td = document.createElement("td")
        td.colSpan =5;
        this.ttfFontSample = document.createElement("input")
        this.ttfFontSample.value = "ABC byz 123";
        this.ttfFontSample.addEventListener("input", () => {this.sanityCheck()});
        td.appendChild(this.ttfFontSample)
        tr.appendChild(td);
        table.appendChild(tr)
        tr = document.createElement("tr")
        td = document.createElement("td")
        td.colSpan = 7;
        this.ttfFontDemo = document.createElement("canvas")
        this.ttfFontDemo.width = 380;
        this.ttfFontDemo.height = 150;
        this.ttfFontDemo.style.backgroundColor = "white";
        this.ttfFontDemo.style.border = "1px solid grey"
        this.ttfFontDemoCtx = this.ttfFontDemo.getContext("2d", {willReadFrequently: true})
        this.magnifier = new CanvasMagnifier(this.ttfFontDemo)
        td.appendChild(this.ttfFontDemo)
        tr.appendChild(td);
        table.appendChild(tr);
        this.ttfDiv.appendChild(table)
        let warning: HTMLParagraphElement = document.createElement('p')
        warning.style.textAlign = "justify"
        warning.style.marginRight = "5px"
        warning.innerText = "IMPORTANT: Be aware than many fonts are copyrighted. Having a font installed  on your " + "computer doesn't neccessarily mean you are allowed to do whatever you want with it. In case of doubt, " + "use public domain fonts from web sites like www.openfont.org, "
        warning.style.fontSize = "smaller"
        this.ttfDiv.appendChild(warning)
        this.virtualHubIsPresent = true;
        this.refreshTtfFontDemo()
      }

    private checkTtFontValue(): boolean
      {
        if (this.ttfFontSize == null) return false
        if (this.ttfFirstChar == null) return false
        if (this.ttfLastChar == null) return false
        if (this.ttfOutlineWidth == null) return false
        if (this.ttfFillAndStroke == null) return false
        let ok: boolean = true;
        this.ttfOutlineWidth.disabled = parseInt(this.ttfFillAndStroke.value) == 1
        ok = ok && this.checkRange(this.ttfFirstChar, "first char", this.ttfLastChar, "last char", 0, 255)
        ok = ok && this.checkRange(this.ttfFontSize, "Font size", null, null, 1, 255)
        if (!ok) return false;
        if (this.ttfDemoOngoingRefresh != null) clearTimeout(this.ttfDemoOngoingRefresh)
        if (!this.ttfDemoOngoingRefreshRunning) this.ttfDemoOngoingRefresh = setTimeout(() => { this.refreshTtfFontDemo()}, 250); else this.ttfDemoOngoingRefreshMustRunAgain = true;
        return true;
      }

    private refreshCompled(): number
      {
        this.ttfDemoOngoingRefreshRunning = false;
        if (this.ttfDemoOngoingRefreshMustRunAgain) this.ttfDemoOngoingRefresh = setTimeout(() => { this.refreshTtfFontDemo()}, 100)
        return 0
      }

    private refreshTtfFontDemo()
      {
        let sanityCheckIsRequired: boolean = false;
        this.ttfDemoOngoingRefreshRunning = true
        if (this.ttfFontSize == null) return this.refreshCompled()
        if (this.ttfFontSample == null) return this.refreshCompled()
        if (this.ttfFontAntiAliasControl == null) return this.refreshCompled()
        if (this.ttfFontDemo == null) return this.refreshCompled()
        if (this.ttfFontDemoCtx == null) return this.refreshCompled()
        if (this.ttfOutlineWidth == null) return this.refreshCompled()
        if (this.ttfFillAndStroke == null) return this.refreshCompled()
        if (this.ttfDemoInternalcanvas == null)
          {
            this.ttfDemoInternalcanvas = document.createElement('canvas')
            this.ttfDemoInternalcanvas.style.border = "1px solid #d0d0d0"
            this.ttfDemoInternalcanvasCtx = this.ttfDemoInternalcanvas.getContext("2d", {willReadFrequently: true})
            if (this.ttfDemoInternalcanvasCtx == null) throw new RangeError("Unable to get Canvas context")
            sanityCheckIsRequired = this.ImportTtfFont.checked
          }
        if (this.ttfDemoInternalcanvasCtx == null) return // useless, but prevents TS error
        let selectedFont: ttfFont | null = this.selectedTtfFont()
        if (selectedFont == null) return this.refreshCompled();
        let sampletext: string = this.ttfFontSample.value;
        if (sampletext == "") sampletext = "demo"
        let size: number = parseInt(this.ttfFontSize.value)
        if (isNaN(size)) return this.refreshCompled()
        if (size < 1) return this.refreshCompled()
        if (size > 255) return this.refreshCompled()
        let stokeWidth: number = 0;
        let fillStroke: number = parseInt(this.ttfFillAndStroke.value);
        if (parseInt(this.ttfFillAndStroke.value) > 1) stokeWidth = parseInt(this.ttfOutlineWidth.value) / 10.0
        this.ttfDemoInternalcanvasCtx.font = size + "px " + selectedFont.fontName
        this.ttfDemoInternalcanvasCtx.fillStyle = "black";
        this.ttfDemoInternalcanvasCtx.strokeStyle = "black";
        let textsize: TextMetrics = this.ttfDemoInternalcanvasCtx.measureText(sampletext)
        let height: number = Math.ceil(Math.abs(textsize.actualBoundingBoxAscent) + Math.abs(textsize.actualBoundingBoxDescent))
        let width: number = Math.ceil(textsize.width)
        this.ttfDemoInternalcanvas.width = width   // with reset some the canvas properties such as  textBaseline
        this.ttfDemoInternalcanvas.height = height
        this.ttfDemoInternalcanvasCtx.textBaseline = "top";
        this.ttfDemoInternalcanvasCtx.font = size + "px " + selectedFont.fontName
        this.ttfDemoInternalcanvasCtx.lineWidth = stokeWidth
        if (fillStroke & 1) this.ttfDemoInternalcanvasCtx.fillText(sampletext, 0, 1)
        if (fillStroke & 2) this.ttfDemoInternalcanvasCtx.strokeText(sampletext, 0, 1)
        let threshold: number = parseInt(this.ttfFontAntiAliasControl.value)
        let pixels = this.ttfDemoInternalcanvasCtx.getImageData(0, 0, width, height)
        let index: number = 3;
        for (let j: number = 0; j < pixels.height; j++) for (let j: number = 0; j < pixels.width; j++)
          {
            pixels.data[index] = pixels.data[index] < threshold ? 0 : 255
            index += 4
          }
        this.ttfFontDemoCtx.clearRect(0, 0, this.ttfFontDemo.width, this.ttfFontDemo.height);
        this.ttfFontDemoCtx.putImageData(pixels, (this.ttfFontDemo.width - pixels.width) >> 1, (this.ttfFontDemo.height - pixels.height) >> 1)
        this.refreshCompled()
        if (sanityCheckIsRequired) this.sanityCheck()
      }

    private async connect()
      {
        let ipaddress: string = this.yfileHubIpAddress.value
        let errorMsg: YErrorMsg = new YErrorMsg()
        this.connectError.innerText = "Connecting to " + ipaddress
        this.connectError.style.display = ""
        this.connectButton.enabled = false;
        this.yfileHubIpAddress.disabled = true;
        let ok: boolean = false;
        //     if (await YAPI.TestHub(ipaddress,1500,errorMsg) == YAPI.SUCCESS)
        if (await YAPI.RegisterHub(ipaddress, errorMsg) == YAPI.SUCCESS)
          {
            this.connectError.innerHTML = ressources.smallInfoIcon() + "&nbsp;connected to " + ipaddress;
            ok = true;
          }
        if (!ok)
          {
            this.connectError.innerHTML = ressources.smallWarningIcon() + "&nbsp; Cannot connect to " + ipaddress + " : " + errorMsg.msg
          }
        this.yfileHubIpAddress.disabled = false;
        this.connectButton.enabled = true;
      }

    public set visible(yes: boolean)
      {
        this.container.style.display = yes ? "" : "none"
      }

    private addByteParameter(table: HTMLTableElement, desc: string, value: string)
      {
        let tr: HTMLTableRowElement = document.createElement("tr")
        let td: HTMLTableCellElement = document.createElement("td")
        td.innerText = desc + " :"
        tr.appendChild(td)
        td = document.createElement("td")
        let input: HTMLInputElement = document.createElement('input')
        input.addEventListener("input", () => this.sanityCheck())
        input.value = value;
        input.maxLength = 3
        input.size = 3
        input.style.textAlign = "right"
        td.appendChild(input)
        tr.appendChild(td)
        table.appendChild(tr)
        return input
      }

    private ipAddrInputSanityCheck(input: HTMLInputElement, b: Button)
      {
        let value: string = input.value;
        let ok: boolean = true;
        if (value == "")
          {
            b.enabled = false
            input.title = "Enter an IP address"
            input.style.backgroundColor = "";
            return
          }
        let tokens = value.split(".");
        if (tokens.length != 4) ok = false;
        for (let i: number = 0; i < 4; i++)
          {
            let b: number = parseInt(tokens[i])
            if (isNaN(b)) ok = false; else if ((b < 0) || (b > 255)) ok = false;
          }
        if (ok)
          {
            b.enabled = true
            input.title = "Enter an IP address"
            input.style.backgroundColor = "";
            return
          }
        b.enabled = false
        input.title = "Invalid IP address format"
        input.style.backgroundColor = WelcomePanel.BadInputColor;
        return
      }

    private addIPParameter(table: HTMLTableElement, desc: string, button: Button | null, statusmsg: HTMLParagraphElement | null)
      {
        let tr: HTMLTableRowElement = document.createElement("tr")
        let td: HTMLTableCellElement = document.createElement("td")
        td.innerText = desc + " :"
        td.style.whiteSpace = "nowrap"
        tr.appendChild(td)
        td = document.createElement("td")
        let input: HTMLInputElement = document.createElement('input')
        input.addEventListener("input", () => this.ipAddrInputSanityCheck(input, this.connectButton))
        input.maxLength = 15
        input.size = 15
        input.style.textAlign = "right"
        td.appendChild(input)
        tr.appendChild(td)
        td = document.createElement("td")
        if (button != null) td.appendChild(button.htmlelement)
        tr.appendChild(td)
        td = document.createElement("td")
        td.style.fontSize = "smaller"
        if (statusmsg != null) td.appendChild(statusmsg)
        tr.appendChild(td)
        table.appendChild(tr)
        return input
      }

    private scratchSanityCheck()
      {
        let ok: boolean = true;
        ok = ok && this.checkRange(this.scratchFirstChar, "first char", this.scratchLastChar, "last char", 0, 255)
        ok = ok && this.checkRange(this.scratchCharWidth, "Char width", null, null, 1, 128)
        ok = ok && this.checkRange(this.scratchCharHeight, "Char height", null, null, 1, 255)
        return ok;
      }

    private sanityCheck()
      {
        let ok: boolean = false;
        if (this.fromScratch.checked) ok = this.scratchSanityCheck();
        if (this.loadFileFromYfile.checked) ok = this.chosenYFontFile() != null
        if (this.loadFileFromLocalFileSystem.checked) ok = this.dataLoadedFromLocalFs != null
        if (this.ImportTtfFont.checked) ok = this.checkTtFontValue()
        if (this.ImportBdfFont.checked) ok = (this.currentBdfFont != null)

        this.letGoBtn.enabled = ok;
      }

    private choiceChanged(id: string)
      {
        this.loadResultDiv.style.display = "none";
        this.scratchDiv.style.display = id == 'scratch' ? "" : "none";
        this.yfileDiv.style.display = id == 'yfile' ? "" : "none";
        this.localfsDiv.style.display = id == 'localfs' ? "" : "none";
        this.bdfDiv.style.display = id == 'bdf' ? "" : "none";
        this.ttfDiv.style.display = id == 'ttf' ? "" : "none";
        this.sanityCheck();
      }

    private AddOption(id: string, desc: string)
      {
        let input: HTMLInputElement = document.createElement("input");
        input.type = "radio"
        input.name = "What"
        input.id = id
        input.value = id
        input.style.marginLeft = "20px"
        this.container.appendChild(input)
        let radioDesc: HTMLLabelElement = document.createElement("label");
        radioDesc.htmlFor = id
        radioDesc.innerText = desc
        this.container.appendChild(radioDesc)
        this.container.appendChild(document.createElement("br"))
        input.addEventListener("click", () => { this.choiceChanged(id)})
        input.style.cursor = "pointer"
        radioDesc.style.cursor = "pointer"
        return input
      }

    private async startEditor()
      {
        this.showloadResult("", false);
        if (this.fromScratch.checked)
          {
            let first: number = parseInt(this.scratchFirstChar.value);
            let last: number = parseInt(this.scratchLastChar.value);
            let width: number = parseInt(this.scratchCharWidth.value);
            let height: number = parseInt(this.scratchCharHeight.value);
            this.charCollection.initFromScratch(first, last, width, height)
            this.welcomeCompleted(null, null)
          }
        if (this.loadFileFromYfile.checked)
          {
            let selected: YFileFont | null = this.chosenYFontFile()
            if (selected != null)
              {
                let fs: YFiles = selected.fileSystem
                if (!await fs.isOnline())
                  {
                    this.showloadResult(selected.friendlyName + " is now offline", true);
                    return
                  }
                let data: Uint8Array;
                try
                  {data = await fs.download(selected.fontFilename) } catch (e: any)
                  {
                    this.showloadResult("failed to load " + selected.friendlyName + "(" + e.message + ")", true);
                    return;
                  }
                let header: YfmtFileHeader = new YfmtFileHeader(data);
                if (!header.fileOk)
                  {
                    this.showloadResult("cannot use " + selected.friendlyName + "(" + header.error + ")", true);
                    return;
                  }
                this.charCollection.initFromYfmData(data)
                this.welcomeCompleted(selected.fileSystemSerial, selected.fontFilename)
              }
          }

        if ((this.ImportBdfFont.checked) && (this.currentBdfFont) )
          {
            this.charCollection.initFromBdfData(this.currentBdfFont)
            this.welcomeCompleted(null, this.dataLoadedFromLocalFsFilename)

          }

          if ((this.loadFileFromLocalFileSystem.checked) && (this.dataLoadedFromLocalFs != null))
          {
            this.charCollection.initFromYfmData(this.dataLoadedFromLocalFs)
            this.welcomeCompleted(null, this.dataLoadedFromLocalFsFilename)
          }
        if (this.ImportTtfFont.checked)
          {
            if (this.ttfFontSize == null) return
            if (this.ttfFirstChar == null) return
            if (this.ttfLastChar == null) return
            if (this.ttfFontAntiAliasControl == null) return
            if (this.ttfOutlineWidth == null) return
            if (this.ttfFillAndStroke == null) return
            let selectedFont: ttfFont | null = this.selectedTtfFont()
            if (selectedFont == null) return
            let size: number = parseInt(this.ttfFontSize.value)
            if (isNaN(size)) return
            let first: number = parseInt(this.ttfFirstChar.value)
            if (isNaN(first)) return
            let last: number = parseInt(this.ttfLastChar.value)
            if (isNaN(last)) return
            let filter: number = parseInt(this.ttfFontAntiAliasControl.value)
            let outlineWidth: number = parseInt(this.ttfOutlineWidth.value) / 10.0
            if (parseInt(this.ttfFillAndStroke.value) == 1) outlineWidth = 0;
            let fontname: string = selectedFont.fontName;
            this.charCollection.initFromTtfFont(selectedFont.fontName, size, first, last, filter, parseInt(this.ttfFillAndStroke.value), outlineWidth)
            fontname = fontname.replace(" ", "_") + ".yfm"
            this.welcomeCompleted(null, fontname)
          }
        this.cancelBtn.visible = true;
      }

    public async deviceArrival(m: YModule)
      {
        await this.refreshYfsFontList()
        await this.refreshTtfFontList()
      }

    public async deviceRemoval(m: YModule)
      {
        await this.refreshYfsFontList()
      }
  }
