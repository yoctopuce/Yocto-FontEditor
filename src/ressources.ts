/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *   graphic ressources, mainly SVG code
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
export enum BtnFeature {New, Add, Delete, Shadow, SemiTransparent, Selected}

export type BtnFeatures = Set<BtnFeature> | null
export type SVGsrcCall = (size: number, features: BtnFeatures) => string;

export class ressources
  {
    private static SVGheader(size: number, shadowDef: boolean, title?: string): string
      {
        let strsize: string = size.toString();
        let res: string = '<svg  xmlns="http://www.w3.org/2000/svg" width="' + strsize + '" height="' + strsize + '" viewBox="0 0 ' + strsize + ' ' + strsize + '">';
        if (typeof (title) != "undefined") res = res + "<title>" + title + "</title>";
        if (shadowDef) res = res + '<defs><filter id="f1" x="0" y="0"><feGaussianBlur in="SourceGraphic" stdDeviation="2" /></filter></defs>';
        //   res = res + '<g transform="translate(0,-23 )">'
        if (size != 32)
          {
            let scale: string = (size / 32).toString();
            res = res + '<g transform="scale(' + scale + ',' + scale + ')">';
          }
        return res;
      }

    private static SVGFooter(): string
      {
        return '</g></g></svg>';
      }

    private static addIconTransparency(): string { return '<g opacity="0.5">' };

    private static addIconSrcCode(): string
      {
        return '<path d="m4 2v3h-3v3h3v3h3v-3h3v-3h-3v-3z" style="fill:#67e06d;stroke-linecap:round;stroke:#2e5e30"/>'
      }

    private static newIconSrcCode(): string
      {
        return '<path transform="matrix(1.3 0 0 1.2 1.6 5.5)" d="m7.5 5.5-3-1.9-2.9 1.9 0.84-3.4-2.7-2.2 3.5-0.25 1.2-3.3 1.3 3.2 3.5 0.14-2.7 2.3z" style="fill:#ffed00;stroke-linecap:round;stroke-linejoin:round;stroke-width:.79;stroke:#d7c800"/>'
      }

    private static deleteIconSrcCode(): string
      {
        return ' <rect x="2" y="6" width="9" height="3" style="fill:#FF0000;stroke-linecap:round;stroke:#5e2e2e"/>';
      }

    private static selectedIconScrCode(): string
      {
        return '<path d="m17 26 2-2 3 3 7-7 2 2-9 9z" style="fill-rule:evenodd;fill:#67e06d;stroke-width:1px;stroke:#357338"/>';
      }

    private static IconSourceCode(size: number, features: BtnFeatures, shadowcode: string, activeCode: string, title?: string): string
      {
        let shadow: boolean = false;
        let semitransparent: boolean = false;
        let newIcon: boolean = false;
        let addIcon: boolean = false;
        let deleteIcon: boolean = false;
        let selected: boolean = false;
        if (features != null)
          {
            shadow = features.has(BtnFeature.Shadow);
            semitransparent = features.has(BtnFeature.SemiTransparent);
            newIcon = features.has(BtnFeature.New);
            addIcon = features.has(BtnFeature.Add);
            deleteIcon = features.has(BtnFeature.Delete);
            selected = features.has(BtnFeature.Selected);
          }
        let res: string = ressources.SVGheader(size, shadow, title);
        if (shadow) res = res + '<g transform="translate(6,-6)">' + shadowcode + "</g>"
        if (semitransparent) res = res + ressources.addIconTransparency();
        res = res + activeCode;
        if (semitransparent) res = res + '</g>';
        if (newIcon) res = res + ressources.newIconSrcCode(); // yellow star in the top left corner
        if (addIcon) res = res + ressources.addIconSrcCode(); // green plus in the top left corner
        if (deleteIcon) res = res + ressources.deleteIconSrcCode(); // red minus in the top left corner
        if (selected) res = res + ressources.selectedIconScrCode();
        res = res + ressources.SVGFooter();
        return res;
      }

    public static ZoomInIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<path d="m12 20 4-4" style="fill:none;stroke-width:2;stroke:#595959"/>' + '<circle cx="22" cy="10" r="8" style="fill:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#747474"/>' + '<path d="m14 18-10 10" style="fill:none;stroke-linecap:round;stroke-width:4;stroke:#000000"/>' + '<path d="m22 6v9" style="fill:none;stroke-width:2;stroke:#000000"/>' + '<path d="m17 10h9" style="fill:none;stroke-width:2;stroke:#000000"/>');
      }

    public static ZoomOutIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<path d="m12 20 4-4" style="fill:none;stroke-width:2;stroke:#595959"/>' + '<circle cx="22" cy="10" r="8" style="fill:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#747474"/>' + '<path d="m14 18-10 9" style="fill:none;stroke-linecap:round;stroke-width:4;stroke:#000000"/>' + '<path d="m17 10h9" style="fill:none;stroke-width:2;stroke:#000000"/>');
      }

    public static SetBlackColorIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect x="8" y="8" width="15" height="15" style="fill:#000000"/>' + '<path d="m8 4v23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m24 4v23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m4 8h23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m4 24h23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>');
      }

    public static SetWhiteColorIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect x="8" y="8" width="15" height="15" style="fill:#ffffff"/>' + '<path d="m8 4v23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m24 4v23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m4 8h23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m4 24h23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>');
      }

    public static SetReverseColorIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect x="8" y="8" width="15" height="15" style="fill:#000000"/>' + '<path d="m8 24v-15h15z" style="fill-rule:evenodd;fill:#ffffff"/>' + '<path d="m8 4v23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m24 4v23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m4 8h23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>' + '<path d="m4 24h23" style="fill:none;stroke-width:1px;stroke:#7d7d7d"/>');
      }

    public static portraitIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect  x="6" y="4" width="19" height="25" style="fill:#ececec;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#b5b5b5"/>' + '<path d="m11 23 3-13h4l3 13" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m11 21h8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>');
      }

    public static paysageIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect  x="3" y="7" width="25" height="19" style="fill:#ececec;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#b5b5b5"/>' + '<path d="m11 23 3-13h4l3 13" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m11 21h8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>');
      }

    public static BaselineUpIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<path d="m2 20h26" style="fill:none;stroke-width:1px;stroke:#ff0000"/>' + '<path d="m27 17v-3" style="fill:none;stroke-width:1px;stroke:#ff0000"/>' + '<path d="m24 14h6l-3-5z" style="fill-rule:evenodd;fill:#ff0000"/>' + '<path d="m12 8-6 16" style="fill:none;stroke-linecap:round;stroke-width:2;stroke:#606060"/>' + '<path d="m2 8 5 11" style="fill:none;stroke-linecap:round;stroke-width:2;stroke:#606060"/>' + '<ellipse cx="18" cy="14" rx="4" ry="6" style="fill:none;stroke-width:2;stroke:#606060"/>');
      }

    public static BaselineDownIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<path d="m2 20h26" style="fill:none;stroke-width:1px;stroke:#ff0000"/>' + '<path d="m27 26v-3" style="fill:none;stroke-width:1px;stroke:#ff0000"/>' + '<path d="m24 26h6l-3 5z" style="fill-rule:evenodd;fill:#ff0000"/>' + '<path d="m12 8-6 16" style="fill:none;stroke-linecap:round;stroke-width:2;stroke:#606060"/>' + '<path d="m2 8 5 11" style="fill:none;stroke-linecap:round;stroke-width:2;stroke:#606060"/>' + '<ellipse cx="18" cy="14" rx="4" ry="6" style="fill:none;stroke-width:2;stroke:#606060"/>');
      }

    static gridCode: string = '<path d="m6 7v20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m11 7v20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m16 7v20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m21 7v20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m26 7v20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m6 7h20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m6 12h20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m6 17h20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m6 22h20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>' + '<path d="m6 27h20" style="fill:none;stroke-linecap:round;stroke-width:1px;stroke:#7f7f7f"/>'

    public static TopRowIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.gridCode + '<rect x="6" y="7" width="20" height="5" style="fill-opacity:.5;fill:#9a9a9a;stroke-linecap:round;stroke-linejoin:round;stroke:#000000"/>')
      }

    public static BottomRowIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.gridCode + '<rect x="6" y="22" width="20" height="5" style="fill-opacity:.5;fill:#9a9a9a;stroke-linecap:round;stroke-linejoin:round;stroke:#000000"/>')
      }

    public static LeftColIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.gridCode + '<rect x="6" y="7" width="5" height="20" style="fill-opacity:.5;fill:#9a9a9a;stroke-linecap:round;stroke-linejoin:round;stroke:#000000"/>')
      }

    public static RightColIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.gridCode + '<rect x="21" y="7" width="5" height="20" style="fill-opacity:.5;fill:#9a9a9a;stroke-linecap:round;stroke-linejoin:round;stroke:#000000"/>')
      }

    public static GlyphIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect x="7" y="4" width="20" height="24" style="fill:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke:#898989"/>' + '<path d="m22 16h-7l-2 2v4l2 2h5l2-1" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m12 12 2-2h6l2 3v10l1 1h1" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>')
      }

    public static CopyCharIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect x="9" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="2" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="23" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="2" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#656565"/>' + '<rect x="9" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="23" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="2" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="9" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="9" width="14" height="20" style="fill:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke:#898989"/>' + '<path d="m26 19h-4l-2 2v2l2 2h2l2-1" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m19 14 1-1h4l2 3v8l1 1h1" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m5 16h10v-2l2 2-2 2v-2" style="fill-rule:evenodd;fill:#4e9551;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#369b35"/>')
      }

    public static PasteCharIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<rect x="9" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="2" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="23" y="2" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="2" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="23" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#656565"/>' + '<rect x="9" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="3" y="12" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="16" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="23" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="2" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="9" y="22" width="5" height="8" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke:#d4d4d4"/>' + '<rect x="3" y="9" width="14" height="20" style="fill:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke:#898989"/>' + '<path d="m12 19h-4l-2 2v2l2 2h2l2-1" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m6 14 1-1h4l2 3v8l1 1h1" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#000000"/>' + '<path d="m16 16h6v-2l2 2-2 2v-2" style="fill-rule:evenodd;fill:#4e9551;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;stroke:#369b35"/>')
      }

    public static selectionIconSrcCode(): string
      {
        return '<path d="m4 2v28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m12 2v28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m20 2v28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m28 2v28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m2 4h28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m2 12h28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m2 20h28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m2 28h28" style="fill:none;stroke-width:1px;stroke:#d0d0d0"/>' + '<path d="m4 6v-2h2" style="fill:none;stroke-width:1px;stroke-linejoin:round;stroke:blue"/>' + '<path d="m6 28h-2v-2" style="fill:none;stroke-width:1px;stroke-linejoin:round;stroke:blue"/>' + '<path d="m28 6v-2h-2" style="fill:none;stroke-width:1px;stroke-linejoin:round;stroke:blue"/>' + '<path d="m28 26v2h-2" style="fill:none;stroke-width:1px;stroke-linejoin:round;stroke:blue"/>' + '<path d="m8 4h4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m14 4h4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m20 4h4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m8 28h4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m14 28h4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m20 28h4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m4 12v-4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m4 18v-4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m4 24v-4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m28 12v-4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m28 18v-4" style="fill:none;stroke-width:1px;stroke:blue"/>' + '<path d="m28 24v-4" style="fill:none;stroke-width:1px;stroke:blue"/>'
      }

    public static NewSelectionIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode())
      }

    public static SelectionVrtMirrorIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode() + '<path d="m10 11v3h12v-3l5 5-5 5v-3h-12v3l-5-5z" style="fill-rule:evenodd;fill:#3d9745"/>' + '<path d="m16 6v3" style="fill:none;stroke-width:1px;stroke:black"/>' + '<path d="m16 24v3" style="fill:none;stroke-width:1px;stroke:black"/>' + '<path d="m16 10v1" style="fill:none;stroke-width:1px;stroke:black"/>' + '<path d="m16 12v3" style="fill:none;stroke-width:1px;stroke:black"/>' + '<path d="m16 18v3" style="fill:none;stroke-width:1px;stroke:black"/>' + '<path d="m16 22v1" style="fill:none;stroke-width:1px;stroke:black"/>')
      }

    public static SelectionHrzMirrorIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode() + '<path d="m11 22h3v-12h-3l5-5 5 5h-3v12h3l-5 5z" style="fill-rule:evenodd;fill:#3d9745"/>' + '<path d="m6 16h3"  style="fill:none;stroke-width:1px;stroke:#777777"/>' + '<path d="m23 16h3" style="fill:none;stroke-width:1px;stroke:#777777"/>' + '<path d="m10 16h1" style="fill:none;stroke-width:1px;stroke:#777777"/>' + '<path d="m11 16h3" style="fill:none;stroke-width:1px;stroke:#777777"/>' + '<path d="m17 16h3" style="fill:none;stroke-width:1px;stroke:#777777"/>' + '<path d="m21 16h1" style="fill:none;stroke-width:1px;stroke:#777777"/>')
      }

    public static SelectionBlackFillIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode() + '<rect x="6" y="6" width="20" height="20" style="fill:black"/>')
      }

    public static SelectionWhiteFillIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode() + '<rect x="6" y="6" width="20" height="20" style="fill:white"/>')
      }

    public static SelectionNegativeIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode() + '<path d="m6 26v-20h20z" style="fill-rule:evenodd;fill:#000000;stroke-linecap:round;stroke-linejoin:bevel;stroke-width:1px;stroke:#000000"/>' + '<path d="m26 6v20h-20z" style="fill-rule:evenodd;fill:#ffffff;paint-order:fill markers stroke;stroke-linecap:round;stroke-linejoin:round;stroke-width:1px;stroke:#d8d8d8"/>')
      }

    public static SelectionPaste(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", ressources.selectionIconSrcCode() + '<path d="m23.51 15.5c-1.641-0.02526-3.088 1.372-3.045 2.914s1.543 2.616 1.537 3.586v4h3v-4c0-0.5 1.228-1.91 1.463-3.496s-1.314-2.979-2.955-3.004z" style="fill:#b4965c;paint-order:fill markers stroke;stroke-linecap:round;stroke-linejoin:round;stroke:#5a4b2e"/>' + '<rect x="17.5" y="25.5" width="12" height="4" style="fill:#caa867;paint-order:fill markers stroke;stroke-linecap:round;stroke-linejoin:round;stroke:#5a4b2e"/>')
      }

    public static UndoIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<path d="m12 2-7 6 7 6v-4h6v-2e-3a2 2 0 0 0 0.02 2e-3c4 0.01 7 3 7 7 0.02 4-3 7-7 8a2 2 0 0 0-0.09 0.02v-0.02h-15v3h15v-0.02a2 2 0 0 0 0.1 0.02c6-0.07 10-5 10-11-0.03-6-5-10-10-10a2 2 0 0 0-0.03 4e-3v-4e-3h-6z" style="-inkscape-stroke:none;color:#000000;fill:#25ab40;paint-order:fill markers stroke;stroke-linecap:round;stroke-linejoin:round;stroke:#25ab40"/>')
      }

    public static RedoIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<g transform="matrix(-1,0,0,1,34,0)">' + '<path d="m14 2-6 6 6 6v-4h6v-2e-3c6e-3 7e-4 0.01 1e-3 0.02 2e-3 4 0.01 7 3 7 7 0.02 4-3 7-7 8-0.03 4e-3 -0.06 9e-3 -0.09 0.02v-0.02h-15v3h15v-0.02c0.04 8e-3 0.09 0.02 0.1 0.02 6-0.07 10-5 10-11-0.03-6-5-10-10-10-8e-3 1e-3 -0.02 3e-3 -0.03 4e-3v-4e-3h-6z" style="-inkscape-stroke:none;color:#000000;fill:#25ab40;paint-order:fill markers stroke;stroke-linecap:round;stroke-linejoin:round;stroke:#25ab40"/>' + '</g>')
      }

    public static HomeIcon(size: number, features: BtnFeatures = null): string
      {
        return ressources.IconSourceCode(size, features, "", '<path d="m19 8v-3h2v5" style="fill-rule:evenodd;fill:#842323;stroke-linecap:round;stroke-width:1px;stroke:#000000"/>' + '<path d="m24 27h-16v-14l8-8 8 8z" style="fill-rule:evenodd;fill:#ffffe9"/>' + '<path d="m8 14v13h16v-13" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:1px;stroke:#000000"/>' + '<path d="m5 16 11-11 11 11" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;stroke:#000000"/>')
      }

    private static AppIcon(): string
      {
        return "<rect x='0' y='0' width='32' height='32' rx='2' ry='2' fill='dodgerblue' />" + "<g transform='matrix(4.5 0 0 4.4 -1.7 -4)'>" + "<path d='m4.9 5.6h-2.2l-0.38 0.88q-0.14 0.33-0.14 0.49 0 0.13 0.12 0.23 0.12 0.095 0.53 0.12v0.15h-1.8v-0.15q0.35-0.062 0.45-0.16 0.21-0.2 0.47-0.81l2-4.6h0.14l2 4.7q0.24 0.56 0.43 0.73 0.19 0.17 0.54 0.19v0.15h-2.2v-0.15q0.33-0.017 0.45-0.11 0.12-0.095 0.12-0.23 0-0.18-0.17-0.57zm-0.12-0.31-0.95-2.3-0.98 2.3z' fill='none' stroke='white' stroke-opacity='0.5' stroke-width='0.2'/>" + "</g>" + "<path d='m15 2.5h4.1v4.1h2v6.1h2v4.1h2v4.1h2v4.1h2v2h2v2h-12v-2h4.1v-2h-2v-4.1h-6.1v-2h4.1v-4.1h-2v-4.1h-2z' fill='white' stroke=''/>" + "</svg>"
      }

    public static favIcon(): string
      {
        return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" + ressources.AppIcon()
      }

    public static appIcon(): string
      {
        return "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 32 32'>" + ressources.AppIcon()
      }

    public static smallWarningIcon(): string
      {
        return '<svg width="16" height="16" version="1.1" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">' + '<path d="m8 3 7 12h-14z" fill="#ffe054" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width=".96"/>' + '<path d="m8 7v5" fill="none" stroke="#000" stroke-width="1.1px"/>' + '<circle cx="8" cy="13" r=".5"/>' + '</svg>'
      }

    public static smallInfoIcon(): string
      {
        return '<svg width="16" height="16" version="1.1" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">' + '<circle cx="8" cy="9" r="7" fill="#6f86e4"/>' + '<path d="m8 7v6" fill="none" stroke="#fff" stroke-width="2"/>' + '<circle cx="8" cy="5" r="1" fill="#fff"/>' + '</svg>'
      }
  }