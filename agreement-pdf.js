// Builds the Act On Build Residential Insurance Restoration Agreement as a fillable PDF.
// Works in the browser (PDFLib global from cdnjs) and in node (require('pdf-lib')).
// buildAgreementPDF(d) -> Uint8Array
//   d = { biz:{name,address,phone,email,license,warranty,title}, fields:{...}, sigOwner:dataURL|"", sigContractor:dataURL|"" }
async function buildAgreementPDF(d, PDFLibRef){
  const L = PDFLibRef || (typeof PDFLib !== "undefined" ? PDFLib : require("pdf-lib"));
  const { PDFDocument, StandardFonts, rgb } = L;
  const NAVY = rgb(0.2,0.329,0.529), RED = rgb(0.867,0.255,0.259), GREY = rgb(0.353,0.392,0.439), INK = rgb(0.078,0.11,0.149), LINE = rgb(0.796,0.831,0.89), FILL = rgb(0.933,0.945,0.965);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Residential Insurance Restoration Agreement — ${d.fields.owner||""}`);
  pdf.setAuthor(d.biz.name||"Act On Build");
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold), ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const form = pdf.getForm();
  const W=612, H=792, M=54, CW=W-2*M;
  let page, y, pageNo=0;
  const b=d.biz, f=d.fields;
  const FS=9.6, LH=13.2;

  const footer=()=>{ const t=`${b.name||"Act On Build"} — Residential Insurance Restoration Agreement — Page ${pageNo}`; page.drawText(t,{x:M,y:30,size:7.5,font,color:GREY}); };
  const newPage=()=>{ page=pdf.addPage([W,H]); pageNo++; y=H-M; footer(); };
  const need=(h)=>{ if(y-h<M+20) newPage(); };
  // word-wrap draw; returns nothing. Supports simple bold via segments [{t,b}]
  const wrapLines=(segs,width,size)=>{ const lines=[]; let cur=[],curW=0; const sp=font.widthOfTextAtSize(" ",size);
    segs.forEach(sg=>{ const fnt=sg.b?bold:(sg.i?ital:font); sg.t.split(/\s+/).filter(Boolean).forEach(word=>{ const ww=fnt.widthOfTextAtSize(word,size); if(curW+ww>width&&cur.length){lines.push(cur);cur=[];curW=0;} cur.push({w:word,fnt,ww}); curW+=ww+sp; }); });
    if(cur.length)lines.push(cur); return lines; };
  const para=(segs,{size=FS,indent=0,after=6,color=INK,justify=true}={})=>{ if(typeof segs==="string")segs=[{t:segs}];
    const lines=wrapLines(segs,CW-indent,size); const sp=font.widthOfTextAtSize(" ",size);
    lines.forEach((ln,i)=>{ need(LH); let x=M+indent; const last=i===lines.length-1; const wsum=ln.reduce((s,w)=>s+w.ww,0); const gap=(justify&&!last&&ln.length>1)?(CW-indent-wsum)/(ln.length-1):sp;
      ln.forEach(w=>{ page.drawText(w.w,{x,y:y-size,size,font:w.fnt,color}); x+=w.ww+gap; }); y-=LH; });
    y-=after; };
  const bullet=(segs)=>{ need(LH); page.drawText("•",{x:M+8,y:y-FS,size:FS,font,color:INK}); para(segs,{indent:22,after:3}); };
  const h3=(t)=>{ need(30); y-=6; page.drawText(t,{x:M,y:y-11,size:11,font:bold,color:NAVY}); y-=19; };
  const fieldName=(k)=>`aob_${k}`;
  const textField=(key,val,x,yy,w,h,{size=9,multiline=false}={})=>{ const tf=form.createTextField(fieldName(key)); tf.setText(val||""); if(multiline)tf.enableMultiline(); tf.addToPage(page,{x,y:yy,width:w,height:h,borderWidth:0,backgroundColor:rgb(1,0.99,0.93),borderColor:LINE,font}); tf.setFontSize(size); return tf; };

  // ---------- page 1 header ----------
  newPage();
  let lx=M;
  if(d.logo){ try{ const lg=await pdf.embedJpg(d.logo); const lh=44, lw=lg.width*(lh/lg.height); page.drawImage(lg,{x:M,y:y-lh,width:lw,height:lh}); lx=M+lw+12; }catch(e){} }
  page.drawText((b.name||"ACT ON BUILD").toUpperCase(),{x:lx,y:y-30,size:22,font:bold,color:NAVY});
  page.drawLine({start:{x:M,y:y-52},end:{x:W-M,y:y-52},thickness:2.5,color:RED});
  y-=62;
  const co=[b.address,b.phone,b.email,b.license?`Lic. ${b.license}`:""].filter(Boolean).join("   ·   ");
  page.drawText(co,{x:M,y:y-8,size:8.5,font,color:GREY}); y-=22;
  page.drawText("Residential Insurance Restoration Agreement",{x:M,y:y-16,size:17,font:bold,color:NAVY}); y-=22;
  page.drawText("Contract for repair of insured property damage — scope and price set by the insurance-approved estimate",{x:M,y:y-9,size:8.8,font:ital,color:GREY}); y-=22;

  // ---------- info table with fillable fields ----------
  const rows=[["Homeowner (“Owner”)","owner"],["Property","property"],["Owner phone","ownerPhone"],["Owner email","ownerEmail"],["Contractor",null],["Type of loss","loss"],["Date of loss","dol"],["Insurance carrier","carrier"],["Policy number","policy"],["Claim number","claimNo"],["Adjuster","adjuster"],["Agreement date","date"]];
  const RH=19, KW=150;
  rows.forEach(([label,key])=>{ need(RH); const top=y, bot=y-RH;
    page.drawRectangle({x:M,y:bot,width:KW,height:RH,color:FILL,borderColor:LINE,borderWidth:0.6});
    page.drawRectangle({x:M+KW,y:bot,width:CW-KW,height:RH,borderColor:LINE,borderWidth:0.6});
    page.drawText(label,{x:M+6,y:bot+6,size:8.8,font:bold,color:INK});
    if(key) textField(key,f[key],M+KW+3,bot+2.5,CW-KW-6,RH-5); else page.drawText(`${b.name||"Act On Build"} (“Contractor”)`,{x:M+KW+6,y:bot+6,size:9,font,color:INK});
    y=bot; });
  y-=10;

  // ---------- body ----------
  const nm=b.name||"Act On Build"; const wy=b.warranty||1; const wyWord=wy===1?"one (1) year":`${wy} years`;
  h3("1. What this agreement is");
  para("Owner hires Contractor to repair the damage at the Property described above, and Contractor agrees to do that work. The work is being paid for primarily by Owner’s property insurance claim, so the scope of work and the price are tied to the insurance company’s approved estimate, as described below. This is a contract for repair work. Contractor is not a public adjuster, does not represent Owner in negotiating the claim, and does not charge Owner for anything other than the repair work described here.");
  h3("2. Scope of work");
  para([{t:"Contractor will perform the repairs listed in the insurance carrier’s approved repair estimate for this claim (the “Approved Scope”), as it may be revised by the carrier, including the following areas: "},{t:(f.rooms||"the areas identified in the Approved Scope")+",",b:true},{t:" and any other areas the carrier approves. Contractor will prepare a detailed Xactimate estimate of the damage and repairs to assist Owner in documenting the loss; that estimate becomes part of the Approved Scope only to the extent the carrier approves it."}]);
  para("If Contractor discovers additional damage caused by this loss during the work (for example, damage inside walls or under flooring that could not be seen before demolition), Contractor will document it with photos and measurements and submit a supplemental estimate to the carrier as the repair contractor. Supplemental work is performed once the carrier approves it, or once Owner approves it in writing as a Change Order under Section 6.");
  para("Work not in the Approved Scope or an approved Change Order is not included. Upgrades Owner chooses beyond the approved materials or grades are Owner’s cost and will be priced in writing before they are ordered.");
  h3("3. Contract price");
  para("The price for the work is the Replacement Cost Value (RCV) of the Approved Scope as finally determined by the carrier, including all approved supplements, plus overhead and profit and sales tax where the carrier includes them, plus any Change Orders signed by Owner. Because the price is set by the carrier’s figures, it will be confirmed in writing to Owner when the carrier issues or revises its estimate. Owner is not asked to pay any amount for approved work beyond the insurance proceeds and Owner’s deductible, except for Change Orders or upgrades Owner requests.");
  h3("4. Payment");
  const ded=f.deductible?`$${Number(f.deductible).toLocaleString("en-US",{minimumFractionDigits:2})}`:"the amount stated in Owner’s policy";
  bullet([{t:"Deductible. ",b:true},{t:`Owner pays Owner’s policy deductible of ${ded} to Contractor before work begins or at the time of the first insurance payment, whichever is later. Contractor does not waive, absorb, or rebate deductibles; doing so is insurance fraud in Kentucky (KRS 304.47-020).`}]);
  bullet([{t:"Actual Cash Value (ACV) payment. ",b:true},{t:"When the carrier issues its first payment (the approved amount less depreciation and deductible), Owner pays that amount to Contractor, and Contractor orders materials and begins work."}]);
  bullet([{t:"Progress. ",b:true},{t:"For work lasting more than 30 days, Contractor may invoice for completed portions of the Approved Scope as insurance payments are received."}]);
  bullet([{t:"Recoverable depreciation and supplements. ",b:true},{t:"When the work is complete, Contractor will send the carrier the completion photos and certificate of completion needed to release the withheld depreciation and any approved supplements. Owner pays those amounts to Contractor within 10 days of receiving them from the carrier."}]);
  bullet([{t:"Change Orders and upgrades. ",b:true},{t:"Due as stated on the signed Change Order."}]);
  y-=3;
  para("Owner authorizes Contractor to communicate directly with the carrier and its adjusters about the scope, pricing, inspections, documentation, and status of the repair work, and to submit estimates, supplements, photos, and completion documents for the work. Owner will forward claim correspondence, estimates, and payment notices to Contractor promptly. If any insurance check is made payable to Owner and a mortgage company, Owner will obtain the mortgage company’s endorsement without unreasonable delay.");
  h3("5. Schedule");
  para(`Work is expected to start within ${f.startDays||10} days after Contractor receives the carrier’s approved estimate, the ACV payment, and the deductible, and to be substantially complete within approximately ${f.doneDays||45} days after starting. Dates may shift for carrier approvals, material lead times, weather, access, building or condominium association requirements, or hidden conditions. Contractor will keep Owner informed of the schedule.`);
  h3("6. Change orders");
  para("Any change to the scope, materials, or price that is not a carrier-approved supplement must be in a written Change Order signed by Owner and Contractor before that work starts. A Change Order states the work, the price, and the payment terms.");
  h3("7. Contractor’s responsibilities");
  bullet("Perform the work in a workmanlike manner, using materials of the grade and quality in the Approved Scope, and in compliance with applicable building codes.");
  bullet("Obtain permits required for the work; permit fees are part of the Approved Scope or a Change Order.");
  bullet("Maintain general liability insurance and provide a certificate on request.");
  bullet("Keep the work area reasonably clean and protect Owner’s belongings in the work area; contents moving and storage is included only if it is in the Approved Scope.");
  bullet("Remove construction debris from the Property at completion.");
  h3("8. Owner’s responsibilities");
  bullet("Provide access to the Property and the affected areas and utilities during normal working hours.");
  bullet("Provide any condominium or homeowner association approvals or access needed for the work, and inform Contractor of association rules that apply.");
  bullet("Remove or secure valuables and fragile items from the work area.");
  bullet("Keep the claim open, respond to the carrier, and make the payments in Section 4 when due.");
  h3("9. Hidden conditions, mold, and existing conditions");
  para("Contractor is not responsible for conditions that existed before this loss or that are not caused by it, including prior damage, code deficiencies, or defects in the building. If mold, asbestos, lead, or other hazardous material is found, Contractor will stop work in that area and notify Owner; remediation of those materials is not part of this agreement unless added by carrier approval or Change Order. Contractor makes no representation about air quality or the presence or absence of mold beyond the areas it treats under the Approved Scope.");
  h3("10. Warranty");
  para(`Contractor warrants its workmanship for ${wyWord} from substantial completion and will repair defects in its workmanship reported in writing during that period at no charge. Manufacturers’ warranties on materials and products pass to Owner. This warranty does not cover normal wear, damage caused by others, water intrusion from a new event, or work performed by others.`);
  h3("11. If the claim is denied or reduced");
  para("If the carrier denies the claim before work begins, either party may cancel this agreement in writing and Owner owes nothing except for any Change Order work already performed. If the carrier reduces or refuses part of the scope, Contractor will perform the approved portion, and the unapproved portion is removed from the work unless Owner elects in writing to pay for it as a Change Order.");
  h3("12. Cancellation, default, and disputes");
  para("Owner may cancel this agreement without penalty within three (3) business days after signing (see the Notice of Cancellation on the last page). After that, if Owner cancels before work starts, Owner reimburses Contractor for materials ordered that cannot be returned and for services actually performed (including estimating and documentation, at a reasonable value not to exceed 10% of the ACV amount). If either party fails to perform and does not cure within 10 days of written notice, the other party may terminate. Contractor retains its right to file a mechanic’s lien under Kentucky law for unpaid work. The parties will try in good faith to resolve any dispute directly, then by mediation, before either files suit. This agreement is governed by Kentucky law, with venue in Jefferson County, Kentucky.");
  h3("13. Entire agreement");
  para("This agreement, the Approved Scope (as revised by the carrier), and any signed Change Orders are the whole agreement. Changes must be in writing and signed by both parties. If any provision is unenforceable, the rest remains in effect.");

  // ---------- signatures ----------
  y-=4; need(200);
  h3("Signatures");
  para("By signing below, Owner and Contractor agree to the terms of this agreement. Owner acknowledges receiving a completed copy and two copies of the Notice of Cancellation.",{after:8});
  const colW=(CW-16)/2, SH=132;
  const sigBox=async(x,who,imgData,dateKey,nameKey,subLabel)=>{ const top=y, bot=y-SH;
    page.drawRectangle({x,y:bot,width:colW,height:SH,borderColor:LINE,borderWidth:0.8});
    page.drawText(who,{x:x+8,y:top-14,size:9,font:bold,color:NAVY});
    const lineY=bot+50, areaTop=top-20, areaH=areaTop-lineY-2;
    page.drawLine({start:{x:x+8,y:lineY},end:{x:x+colW-8,y:lineY},thickness:0.8,color:INK});
    if(imgData){ try{ const png=await pdf.embedPng(imgData); const sc=Math.min((colW-24)/png.width,areaH/png.height); page.drawImage(png,{x:x+12,y:lineY+2,width:png.width*sc,height:png.height*sc}); }catch(e){} }
    page.drawText("Signature",{x:x+8,y:lineY-9,size:6.5,font,color:GREY});
    if(nameKey){ page.drawText("Printed name",{x:x+8,y:bot+18,size:6.5,font,color:GREY}); textField(nameKey,f[nameKey]||"",x+8,bot+26,colW-100,13,{size:8}); }
    else { page.drawText(subLabel,{x:x+8,y:bot+29,size:8,font,color:INK}); page.drawText("Title",{x:x+8,y:bot+18,size:6.5,font,color:GREY}); }
    page.drawText("Date",{x:x+colW-82,y:bot+18,size:6.5,font,color:GREY}); textField(dateKey,f[dateKey]||"",x+colW-82,bot+26,74,13,{size:8});
  };
  await sigBox(M,`OWNER — ${f.owner||""}`,d.sigOwner,"ownerSignedDate","ownerPrinted","");
  await sigBox(M+colW+16,`CONTRACTOR — ${nm}`,d.sigContractor,"contractorSignedDate",null,b.title||"Authorized Representative");
  y-=SH+10;

  // ---------- Notice of Cancellation ----------
  newPage();
  page.drawText("NOTICE OF CANCELLATION",{x:M,y:y-16,size:15,font:bold,color:NAVY}); y-=26;
  para([{t:"(Provided under the Federal Trade Commission Cooling-Off Rule, 16 CFR 429, and KRS 367.46955, for agreements signed at the Owner’s home.)",i:true}],{size:8.5,color:GREY});
  need(20); page.drawText("Date of transaction:",{x:M,y:y-FS,size:FS,font:bold,color:INK}); textField("txDate",f.txDate||"",M+100,y-FS-4,110,15); y-=22;
  para("You may cancel this transaction, without any penalty or obligation, within three business days from the above date.");
  para("If you cancel, any property traded in, any payments made by you under the contract or sale, and any negotiable instrument executed by you will be returned within ten business days following receipt by the seller of your cancellation notice, and any security interest arising out of the transaction will be cancelled.");
  para("If you cancel, you must make available to the seller at your residence, in substantially as good condition as when received, any goods delivered to you under this contract or sale; or you may, if you wish, comply with the instructions of the seller regarding the return shipment of the goods at the seller’s expense and risk.");
  para("If you do make the goods available to the seller and the seller does not pick them up within twenty days of the date of your notice of cancellation, you may retain or dispose of the goods without any further obligation. If you fail to make the goods available to the seller, or if you agree to return the goods to the seller and fail to do so, then you remain liable for performance of all obligations under the contract.");
  para([{t:"To cancel this transaction, mail or deliver a signed and dated copy of this cancellation notice or any other written notice to: "},{t:nm,b:true},{t:`, ${b.address||"____________________"}, not later than midnight of the date shown here:`}]);
  need(20); textField("cancelBy",f.cancelBy||"",M,y-15,130,15); y-=26;
  para([{t:"I hereby cancel this transaction.",b:true}]);
  y-=10; need(40);
  page.drawText("Owner’s signature",{x:M,y:y-8,size:7,font,color:GREY}); page.drawLine({start:{x:M,y:y-30},end:{x:M+260,y:y-30},thickness:0.8,color:INK});
  page.drawText("Date",{x:M+290,y:y-8,size:7,font,color:GREY}); page.drawLine({start:{x:M+290,y:y-30},end:{x:M+400,y:y-30},thickness:0.8,color:INK});
  y-=48;
  para([{t:"Owner acknowledges receiving two copies of this Notice of Cancellation at the time of signing.   Owner initials: ________",i:true}],{size:8.5,color:GREY});

  form.updateFieldAppearances(font);
  return pdf.save();
}
if(typeof module!=="undefined") module.exports={buildAgreementPDF};
