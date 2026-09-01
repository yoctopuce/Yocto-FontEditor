/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  Text and graphic buttons implemantation
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
import {SVGsrcCall, BtnFeature, BtnFeatures} from "./ressources.js"
import {Const} from "./constants.js"

export type onButtonClickCallback = (src: Button) => void;

export abstract class Button
  {
    protected el: HTMLAnchorElement;
    private onclick: onButtonClickCallback;
    protected enabled_state: boolean = true;
    protected selected_state: boolean = false;
    private readonly idleBg: string = Const.ButtonIdleBgColor
    private readonly activeBg: string = Const.ButtonActiveBgColor
    private readonly disabledBg: string = Const.ButtonDisabledBgColor
    private readonly borderEnabled: string = Const.ButtonEnabledBorderColor
    private readonly borderDisabled: string = Const.ButtonDisabledBorderColor

    constructor(description: string, onclick: onButtonClickCallback)
      {
        this.el = document.createElement("a");
        this.onclick = onclick;
        this.el.title = description;
        this.el.style.border = "1px solid " + this.borderEnabled;
        this.el.style.borderRadius = "5px";
        this.el.style.backgroundColor = this.idleBg;
        this.el.style.display = "inline-block";
        this.el.style.cursor = "pointer"
        this.el.style.margin = "3px"
        this.el.style.padding = "3px"
        this.el.addEventListener("mouseover", () => {this.el.style.backgroundColor = this.enabled_state ? this.activeBg : this.disabledBg;});
        this.el.addEventListener("mouseleave", () => {this.el.style.backgroundColor = this.enabled_state ? this.idleBg : this.disabledBg;});
        this.el.addEventListener("mousedown", () =>
        {
          if (this.enabled_state)
            {
              this.el.style.transform = "scale(0.9,0.9)";
              this.onclick(this);
            }
        });
        this.el.addEventListener("mouseup", () => {this.el.style.transform = "scale(1,1)"});
      }

    public set visible(value: boolean)
      {this.el.style.display = value ? "" : "none"}

    public get htmlelement(): HTMLAnchorElement
      {return this.el; }

    public get selected(): boolean
      { return this.selected_state;}

    public set selected(value: boolean)
      {
        if (value == this.selected_state) return;
        this.selected_state = value;
      }

    public get enabled(): boolean
      { return this.enabled_state; }

    public set enabled(value: boolean)
      {
        if (value == this.enabled_state) return;
        this.enabled_state = value;
        if (this.enabled_state)
          {
            this.el.style.borderColor = this.borderEnabled;
            this.el.style.backgroundColor = this.idleBg;
            this.el.style.cursor = "pointer"
          } else
          {
            this.el.style.borderColor = this.borderDisabled;
            this.el.style.backgroundColor = this.disabledBg;
            this.el.style.cursor = "default"
          }
      }
  }

export class ImgButton extends Button
  {
    private svgscrGenerator: SVGsrcCall
    protected size: number = Const.ImgButtonSize;
    protected originalDeco: BtnFeatures;
    static allButtons: ImgButton[] = [];

    static resizeAllButton(size: number)
      {
        for (let i: number = 0; i < ImgButton.allButtons.length; i++) ImgButton.allButtons[i].resize(size);
      }

    constructor(icon: SVGsrcCall, description: string, onclick: onButtonClickCallback, deco: BtnFeatures = null)
      {
        super(description, onclick)
        this.originalDeco = deco;
        this.svgscrGenerator = icon;
        this.el.innerHTML = this.svgscrGenerator(this.size, deco);
        ImgButton.allButtons.push(this)
      }

    private resize(size: number)
      {
        if (this.size == size) return
        this.size = size;
        this.el.innerHTML = this.iconScr();
      }

    private iconScr()
      {
        let deco: BtnFeatures;
        if (this.originalDeco != null) deco = new Set<BtnFeature>(this.originalDeco); else deco = new Set<BtnFeature>()
        if (this.selected_state) deco.add(BtnFeature.Selected);
        if (!this.enabled_state) deco.add(BtnFeature.SemiTransparent);
        return this.svgscrGenerator(this.size, deco);
      }

    public set enabled(value: boolean)
      {
        if (value == this.enabled_state) return
        super.enabled = value
        //this.enabled_state = value;
        this.el.innerHTML = this.iconScr();
      }

    public set selected(value: boolean)
      {
        if (value == this.selected_state) return
        this.selected_state = value;
        this.el.innerHTML = this.iconScr();
      }
  }

export class TxtButton extends Button
  {
    constructor(caption: string, description: string, onclick: onButtonClickCallback)
      {
        super(description, onclick)
        let innerdiv: HTMLSpanElement = document.createElement("span")
        this.htmlelement.innerText = caption
      }

    public set enabled(value: boolean)
      {
        super.enabled = value;
        this.htmlelement.style.color = value ? "" : "gray";
      }
  }