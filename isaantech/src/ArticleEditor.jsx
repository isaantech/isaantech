import React, { useEffect, useRef, useState } from 'react';

function youtubeId(value='') {
  const match = value.trim().match(/youtu\.be\/([\w-]{11})|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)([\w-]{11})/);
  return match ? (match[1] || match[2]) : (/^[\w-]{11}$/.test(value.trim()) ? value.trim() : null);
}

export default function ArticleEditor({ value='', onChange, onImageUpload, autosaveStatus='', placeholder='Start writing your article…' }) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const [busyImage,setBusyImage] = useState(false);
  const [fontFamily,setFontFamily] = useState('Arial');
  const [fontSize,setFontSize] = useState('16px');
  const [textColor,setTextColor] = useState('#17243a');
  const [highlightColor,setHighlightColor] = useState('#fff19a');

  useEffect(() => {
    const el=editorRef.current;
    if (el && value !== el.innerHTML) el.innerHTML=value || '';
  }, [value]);

  const focus=()=>editorRef.current?.focus();
  const command=(name,arg=null)=>{focus();document.execCommand(name,false,arg);emit();};
  const emit=()=>{if(editorRef.current)onChange?.(editorRef.current.innerHTML);};
  const wrapSelection=styles=>{
    focus(); const selection=window.getSelection();
    if(!selection || !selection.rangeCount || selection.isCollapsed)return;
    const range=selection.getRangeAt(0); const span=document.createElement('span');
    Object.entries(styles).forEach(([key,val])=>span.style[key]=val);
    try { span.appendChild(range.extractContents()); range.insertNode(span); selection.removeAllRanges(); const next=document.createRange(); next.selectNodeContents(span); selection.addRange(next); } catch {}
    emit();
  };
  const transformCase=mode=>{
    focus();const selection=window.getSelection();if(!selection?.rangeCount||selection.isCollapsed)return;
    const range=selection.getRangeAt(0);const text=range.toString();
    range.deleteContents();const node=document.createTextNode(mode==='upper'?text.toUpperCase():text.toLowerCase());range.insertNode(node);
    selection.removeAllRanges();const next=document.createRange();next.selectNodeContents(node);selection.addRange(next);emit();
  };
  const insertHtml=html=>{focus();document.execCommand('insertHTML',false,html);emit();};
  const addLink=()=>{const url=window.prompt('Enter the link URL (https://…)');if(url && /^https?:\/\//i.test(url))command('createLink',url);};
  const addYoutube=()=>{const url=window.prompt('Paste a YouTube video URL');const id=url&&youtubeId(url);if(id)insertHtml(`<div class="article-video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);else if(url)window.alert('Please enter a valid YouTube link.');};
  const addImage=async file=>{if(!file)return;if(!onImageUpload){window.alert('Image upload is not configured.');return;}setBusyImage(true);try{const url=await onImageUpload(file);if(url)insertHtml(`<figure class="article-figure"><img src="${url}" alt="${file.name.replace(/[<>"']/g,'')}"/><figcaption contenteditable="true">Add an image caption</figcaption></figure><p></p>`);}catch(error){window.alert(error.message||'Image upload failed.');}finally{setBusyImage(false);if(imageInputRef.current)imageInputRef.current.value='';}};
  const insertTable=()=>insertHtml('<table><tbody><tr><th>Heading 1</th><th>Heading 2</th><th>Heading 3</th></tr><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody></table><p></p>');
  const Tool=({label,action,children,title})=><button type="button" className="editor-tool" title={title||label} aria-label={title||label} onMouseDown={e=>e.preventDefault()} onClick={action}>{children||label}</button>;

  return <div className="article-editor-shell">
    <div className="article-editor-toolbar" role="toolbar" aria-label="Article formatting tools">
      <div className="toolbar-group"><Tool title="Undo" action={()=>command('undo')}>↶</Tool><Tool title="Redo" action={()=>command('redo')}>↷</Tool><Tool title="Clear formatting" action={()=>command('removeFormat')}>Tx</Tool></div>
      <div className="toolbar-group"><select aria-label="Text style" defaultValue="P" onChange={e=>command('formatBlock',e.target.value)}><option value="P">Paragraph</option><option value="H1">Heading 1</option><option value="H2">Heading 2</option><option value="H3">Heading 3</option><option value="BLOCKQUOTE">Quote</option><option value="PRE">Code block</option></select></div>
      <div className="toolbar-group"><Tool title="Bold" action={()=>command('bold')}><b>B</b></Tool><Tool title="Italic" action={()=>command('italic')}><i>I</i></Tool><Tool title="Underline" action={()=>command('underline')}><u>U</u></Tool><Tool title="Strikethrough" action={()=>command('strikeThrough')}><s>S</s></Tool></div>
      <div className="toolbar-group"><label className="editor-color-tool" title="Text colour">A<input type="color" value={textColor} onChange={e=>{setTextColor(e.target.value);command('foreColor',e.target.value)}}/></label><label className="editor-color-tool highlight-tool" title="Highlight">▰<input type="color" value={highlightColor} onChange={e=>{setHighlightColor(e.target.value);focus();document.execCommand('hiliteColor',false,e.target.value);emit()}}/></label></div>
      <div className="toolbar-group"><select aria-label="Font family" value={fontFamily} onChange={e=>{setFontFamily(e.target.value);wrapSelection({'font-family':e.target.value})}}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Times New Roman</option><option>Courier New</option></select><select aria-label="Font size" value={fontSize} onChange={e=>{setFontSize(e.target.value);wrapSelection({'font-size':e.target.value})}}><option value="12px">12</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="20px">20</option><option value="24px">24</option><option value="28px">28</option><option value="32px">32</option></select><select aria-label="Paragraph spacing" defaultValue="18px" onChange={e=>{focus();const node=window.getSelection()?.anchorNode?.parentElement?.closest('p,li,blockquote');if(node)node.style.marginBottom=e.target.value;emit()}}><option value="10px">Tight spacing</option><option value="18px">Normal spacing</option><option value="28px">Wide spacing</option></select></div>
      <div className="toolbar-group"><Tool title="Uppercase" action={()=>transformCase('upper')}>AA</Tool><Tool title="Lowercase" action={()=>transformCase('lower')}>aa</Tool><Tool title="Left align" action={()=>command('justifyLeft')}>☰</Tool><Tool title="Centre align" action={()=>command('justifyCenter')}>≡</Tool><Tool title="Right align" action={()=>command('justifyRight')}>☷</Tool></div>
      <div className="toolbar-group"><Tool title="Bullet list" action={()=>command('insertUnorderedList')}>• List</Tool><Tool title="Numbered list" action={()=>command('insertOrderedList')}>1. List</Tool><Tool title="Indent" action={()=>command('indent')}>⇥</Tool><Tool title="Outdent" action={()=>command('outdent')}>⇤</Tool></div>
      <div className="toolbar-group"><Tool title="Insert hyperlink" action={addLink}>Link</Tool><Tool title="Insert table" action={insertTable}>▦</Tool><Tool title="Insert YouTube video" action={addYoutube}>▶ Video</Tool><Tool title="Insert image" action={()=>imageInputRef.current?.click()}>{busyImage?'Uploading…':'▧ Image'}</Tool><input ref={imageInputRef} hidden type="file" accept="image/*" onChange={e=>addImage(e.target.files?.[0])}/></div>
    </div>
    <div ref={editorRef} className="article-rich-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={emit} onBlur={emit}/>
    <div className="article-editor-footer"><span>Select text to format it. Use the toolbar to add images, tables and YouTube videos.</span><span>{autosaveStatus||'Rich text editor'}</span></div>
  </div>;
}
