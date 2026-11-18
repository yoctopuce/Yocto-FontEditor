
/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *   Glyph Bitmap Distribution Format (BDF) decoder
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




class LineToken
  { public  lineNumber : number
    public  keyword : string
    public  tokens : string[]
    constructor(lineNumber : number, keyword : string,tokens : string[])
      { this.lineNumber = lineNumber
        this.keyword = keyword
        this.tokens = tokens;
      }
  }

enum ProcessState { HEADER,WAIT4CHAR,CHARHEADER,CHARBITMAP }


export class BDFdecoder
  { private decodedCharacters : (HTMLCanvasElement | null)[] = []
    private processState     : ProcessState
    private filename          : string = ""
    private defaultWidth     : number   = NaN
    private defaultHeight    : number   = NaN
    private defaultBaseline  : number   = 0
    private currentWidth     : number   = NaN
    private currentHeight    : number   = NaN
    private currentASCII     : number   = NaN
    private currentBBXSizeX  : number   = 0
    private currentBBXSizeY  : number   = 0
    private defaultOriginX   : number   = 0
    private defaultOriginY   : number   = 0
    private currentBBXOffsetX  : number   = 0
    private currentBBXOffsetY  : number   = 0
    private copyright          : string  = ""
    private lastError          : string = ""


    private currentcanvas : HTMLCanvasElement | null = null;
    private currentctx    : CanvasRenderingContext2D | null = null;
    private currentImageData: ImageData | null = null;
    private currentScanline: number=0;
    constructor()
      { this.processState =  ProcessState.HEADER
        for (let i=0;i<256;i++) this.decodedCharacters.push(null)

      }

    public getChar(asciicode:number):ImageData | null
      {  if ((asciicode>=0) && (asciicode< this.decodedCharacters.length))
           if (this.decodedCharacters[asciicode])
             { // @ts-ignore
               let ctx:CanvasRenderingContext2D | null = this.decodedCharacters[asciicode].getContext("2d", {willReadFrequently: true})
               if (ctx) { // @ts-ignore
                 return ctx.getImageData(0,0,this.decodedCharacters[asciicode]?.width,this.decodedCharacters[asciicode].height)
               }
             }

          return null

      }

    public getHeight():number { return this.defaultHeight}
    public getBaseLine():number { return this.defaultBaseline}
    public getCopyright(): string {return this.copyright}
    public getFilename(): string {return this.filename}

    public previewFont(canvas:HTMLCanvasElement,text:string,align:number =0)
      {
        let totalWidth:  number =0;
        for (let i=0;i<text.length;i++)
          {
            let ascii = text.charCodeAt(i);
            if (ascii<this.decodedCharacters.length)
             if  (this.decodedCharacters[ascii])
               { // @ts-ignore
                 totalWidth+=this.decodedCharacters[ascii].width
               }
          }
        let x :number = Math.trunc((canvas.width- totalWidth)/2)
        if (align<0) x=2
        let y :number = Math.trunc((canvas.height- this.defaultHeight)/2)
        let ctx : CanvasRenderingContext2D | null = canvas.getContext("2d", {willReadFrequently: true})
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i=0;i<text.length;i++)
          {
            let ascii = text.charCodeAt(i);
            if (ascii < this.decodedCharacters.length)
              if (this.decodedCharacters[ascii])
              {
                // @ts-ignore
                ctx.drawImage(this.decodedCharacters[ascii], x, y)
                // @ts-ignore
                x += this.decodedCharacters[ascii].width
              }
          }
      }

    public drawDemo(c:HTMLCanvasElement)
      { c.width=200;
        let ok:boolean = false;
        if (this.lastError=="")
          { ok=true
            let h = this.getHeight();
            if (h<20) h=20
            c.height = h+2;
            this.previewFont(c,this.filename,-1)
            let ctx :RenderingContext | null = c.getContext("2d", {willReadFrequently: true})
            if (ctx)
              { let pixelBuffer: Uint8Array = new Uint8Array(ctx.getImageData(0, 0, c.width, c.height).data.buffer)
                ok = pixelBuffer.some((c:number)=>{return c!=0})
              }
          }


       if (!ok)
          {  c.height = 22;
             let ctx:   CanvasRenderingContext2D | null = c.getContext("2d");
             if (ctx)
               {
                 ctx.font = "12px Arial"; // Set font style
                 ctx.fillStyle="grey"
                 ctx.fillText(this.filename,2, c.height-7); // Draw filled text
               }

          }

        c.style.backgroundColor="white";
        c.addEventListener("mouseover", ()=>{c.style.backgroundColor="lightgray"}  )
        c.addEventListener("mouseout", ()=>{c.style.backgroundColor=""}  )




      }


    private static processLine(line:string, linenumber :number):LineToken
      {
         let n : number  = line.indexOf(" ")
         if (n<0) n= line.length
         let keyword = line.substring(0,n).toUpperCase()
         let tokens:string[] = []
         while (n<line.length)
           {  while ((line.charAt(n)==" ") && (n<line.length))  n++;
              if (n<line.length)
                {  if (line.charAt(n)=='"')
                    { let n2: number = line.indexOf('"',n+1)
                      if (n2<0) n2 = line.length
                      tokens.push(line.substring(n+1,n2))
                      n=n2+1
                    }
                   else
                    { let n2: number = line.indexOf(' ',n)
                      if (n2<0) n2 = line.length
                      tokens.push(line.substring(n,n2))
                      n=n2
                    }
                }
           }

         return new LineToken(linenumber,keyword,tokens)

      }

    private  tokenError(data: LineToken, errmsg:string)
      { this.lastError  =  "Error at line "+data.lineNumber+", "+data.keyword+" : " +errmsg;
        return  this.lastError
      }
    private  generalError( errmsg:string)
      { this.lastError  =  errmsg;
        return  this.lastError
      }

    public errorMsg():string {return this.lastError}

    private processData(data: LineToken) :string
      {
        switch (this.processState)
          {
            case  ProcessState.HEADER:
              switch (data.keyword)
                {
                  case "FONTBOUNDINGBOX":
                    if (data.tokens.length != 4) return this.tokenError(data, "Expected 4 parameters")
                    this.defaultWidth   = parseInt(data.tokens[0]);
                    this.defaultHeight  = parseInt(data.tokens[1]);
                    this.defaultOriginX = parseInt(data.tokens[2]);
                    this.defaultOriginY = parseInt(data.tokens[3]);
                    if ((this.defaultWidth<=0) || (this.defaultHeight<=0)) this.tokenError(data, "invalid dimension")
                    if ((isNaN(this.defaultWidth)) || (isNaN(this.defaultHeight))) return this.tokenError(data, "invalid value")
                    break;
                  case "COMMENT":
                    if ( data.tokens.length>0)
                      {
                        let comment: string = data.tokens[0].toUpperCase()
                        if ((comment.indexOf("COPYRIGHT") >= 0) || (comment.indexOf("(C)") >= 0)) this.copyright = data.tokens[0]
                      }
                    break
                  case "COPYRIGHT":
                    if ( data.tokens.length>0)
                      {
                        let line: string = "";
                        for (let i = 0; i < data.tokens.length; i++) line += ' ' + data.tokens[i]  // copyright line is often missing the "
                        if (line.toUpperCase().indexOf("COPYRIGHT") < 0) line = "Copyright:" + line
                        this.copyright = line;
                      }
                    break
                  case "FONT_DESCENT":
                    if (data.tokens.length != 1) return this.tokenError(data, "Expected 1 parameter")
                    this.defaultBaseline = parseInt(data.tokens[0]);
                    if (isNaN(this.defaultBaseline)) return this.tokenError(data, "invalid value")
                    break;
                  case  "ENDPROPERTIES" :
                    if ((isNaN(this.defaultWidth)) || (isNaN(this.defaultHeight))) return this.tokenError(data, "No FONTBOUNDINGBOX found")
                    this.processState = ProcessState.WAIT4CHAR
                    break;
                }
              break;
            case  ProcessState.WAIT4CHAR:
              if (data.keyword == "STARTCHAR")
                {
                  this.currentWidth = this.defaultWidth
                  this.currentHeight = this.defaultHeight
                  this.currentASCII = NaN;
                  this.currentBBXOffsetX   = 0
                  this.currentBBXOffsetY   = 0
                  this.currentBBXSizeX   = this.currentWidth
                  this.currentBBXSizeY   =  this.currentHeight
                  this.processState = ProcessState.CHARHEADER
                }
              break;
            case ProcessState.CHARHEADER:
              switch (data.keyword)
                {
                  case "ENCODING":
                    if (data.tokens.length != 1) return this.tokenError(data, "Expected 1 parameter")
                    let ascii : number = parseInt(data.tokens[0])
                    if ((ascii>=0)&&(ascii <=255))
                      { this.currentASCII = parseInt(data.tokens[0]);
                        if (isNaN(this.currentASCII)) return this.tokenError(data, "invalid value")
                      }
                    else
                        this.processState = ProcessState.WAIT4CHAR

                    break;
                  case "BBX":
                    if (data.tokens.length != 4) return this.tokenError(data, "Expected 4 parameters")
                    this.currentBBXSizeX   = parseInt(data.tokens[0]);
                    this.currentBBXSizeY   = parseInt(data.tokens[1]);
                    this.currentBBXOffsetX   = parseInt(data.tokens[2]);
                    this.currentBBXOffsetY   = parseInt(data.tokens[3]);
                    if ((isNaN(this.currentBBXSizeX)) || (isNaN(this.currentBBXSizeY)))  return this.tokenError(data, "invalid value")
                    if ((isNaN(this.currentBBXOffsetX)) || (isNaN(this.currentBBXOffsetX)))  return this.tokenError(data, "invalid value")
                    break
                  case "DWIDTH":
                    if (data.tokens.length != 2) return this.tokenError(data, "Expected 2 parameters")
                    this.currentWidth = parseInt(data.tokens[0]);
                    if (isNaN(this.currentWidth)) return this.tokenError(data, "invalid value")
                    break;
                  case "BITMAP":
                    if (isNaN(this.currentASCII)) return this.tokenError(data, "no ENCODING found")
                    this.processState = ProcessState.CHARBITMAP
                    this.currentcanvas = document.createElement('canvas')
                    this.currentcanvas.style.border = "1px solid #d0d0d0"
                    this.currentcanvas.width = this.currentWidth
                    this.currentcanvas.height = this.currentHeight
                    if (this.currentcanvas.width<=0) return this.tokenError(data, "invalid width ("+this.currentcanvas.width+")px")
                    if (this.currentcanvas.height<=0) return this.tokenError(data, "invalid height ("+this.currentcanvas.height+")px")

                    this.currentcanvas.style.imageRendering = "pixelated"
                    this.currentctx = this.currentcanvas.getContext("2d", {willReadFrequently: true})
                    if (this.currentctx == null) throw new RangeError("BDF decoder : Unable to  get Canvas context")
                    this.currentImageData = this.currentctx.getImageData(0, 0, this.currentWidth, this.currentHeight);
                    this.currentScanline = this.currentHeight- this.currentBBXOffsetY-this.currentBBXSizeY+ this.defaultOriginY;

                    break
                  case "ENDCHAR":
                    if (isNaN(this.currentASCII)) return this.tokenError(data, "no BITMAP found")
                    break
                }
              break;
            case ProcessState.CHARBITMAP:
              switch (data.keyword)
                {
                  case "ENDCHAR":
                    this.processState = ProcessState.WAIT4CHAR;
                    if (this.currentctx && this.currentImageData  && this.currentcanvas)
                      {
                        this.currentctx.putImageData(this.currentImageData, 0, 0)
                        if (this.currentASCII<256) this.decodedCharacters[this.currentASCII] = this.currentcanvas

                      }

                    break;
                  default:
                    if (this.currentImageData)
                      { let scanline: string = data.keyword


                        // @ts-ignore
                        let index = (this.currentScanline ) * this.currentcanvas.width * 4
                        if (this.currentScanline >= this.currentHeight) this.tokenError(data, "Too many scanline data")
                        if (index>=0)
                         for (let i = 0; i < scanline.length; i++)
                          { let fourbits: number = parseInt(scanline.charAt(i), 16)
                            if (isNaN(fourbits)) return this.tokenError(data, "Expected hexadecimal character")
                            for (let j=0;j<4;j++)
                              if  (i*4+j+this.currentBBXOffsetX < this.currentWidth )
                              { let index2 = index + (i  * 16) + (j +this.currentBBXOffsetX)  * 4
                                if (index<this.currentImageData.data.length-4)
                                  {
                                    if (fourbits & (1 << (3 - j)))
                                      {
                                        this.currentImageData.data [index2] = 0
                                        this.currentImageData.data [index2 + 1] = 0
                                        this.currentImageData.data [index2 + 2] = 0
                                        this.currentImageData.data [index2 + 3] = 255
                                      } else
                                      {
                                        this.currentImageData.data [index2] = 255
                                        this.currentImageData.data [index2 + 1] = 255
                                        this.currentImageData.data [index2 + 2] = 255
                                        this.currentImageData.data [index2 + 3] = 0
                                      }
                                  }
                              }
                          }

                        this.currentScanline++
                      }
                }
              break
          }
        return "";
      }

    public parse(rawdata:string,filename:string):string
      { let data:LineToken
        this.filename =filename
        rawdata = rawdata +"\n";  // make sure data ends with an empty line (optimization)
        let errmsg  :string ="";
        if (rawdata.substring(0,9).toUpperCase() != 'STARTFONT')
         return  this.generalError("File doesn't start with STARTFONT keyword, probably not a BDF file")
        let linenumber: number = 1;
        let  pos : number =0
        let  cr = rawdata.indexOf("\n",pos)
        while (cr>=0)
          {  let line :string  =  rawdata.slice(pos,cr).replace("\r","").trim();
             pos = cr+1;
             if (line!="")
               { data = BDFdecoder.processLine(line,linenumber)
                 errmsg = this.processData(data);
                 if (errmsg!="") return errmsg
               }
             cr = rawdata.indexOf("\n",pos)
            linenumber++;
          }

        if  (this.processState== ProcessState.HEADER) this.generalError("No ENDPROPERTIES found")
        return "";
      }







  }



