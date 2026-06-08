import { useEffect, useState } from "react";
import {
  View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LibraryItem } from "../../lib/api";
import { getMaterialStreamUrl, isPdfItem } from "../../lib/material";
import { Screen } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

type Params = { MaterialViewer: { item: LibraryItem } };

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function pdfHtml(streamUrl: string) {
  const safeUrl = streamUrl.replace(/'/g, "%27");
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#f8fafc;font-family:system-ui,sans-serif}
  #toolbar{position:fixed;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  button{background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:14px;font-weight:600}
  button:disabled{opacity:.35}
  #pageInfo{font-size:13px;min-width:100px;text-align:center;color:#475569;font-weight:500}
  #canvas-wrap{padding:72px 12px 24px;display:flex;flex-direction:column;align-items:center;gap:16px}
  canvas{max-width:100%;box-shadow:0 4px 24px rgba(0,0,0,.12);border-radius:6px;background:#fff}
  #error{color:#dc2626;text-align:center;padding:40px 20px;font-size:14px}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head><body>
<div id="toolbar">
  <button id="prev" onclick="changePage(-1)">← Prev</button>
  <span id="pageInfo">Loading…</span>
  <button id="next" onclick="changePage(1)">Next →</button>
</div>
<div id="canvas-wrap"></div>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var pdfDoc=null,pageNum=1,pageRendering=false,pageNumPending=null,scale=1.1;
var url='${safeUrl}';
function renderPage(num){
  pageRendering=true;
  pdfDoc.getPage(num).then(function(page){
    var viewport=page.getViewport({scale:scale});
    var canvas=document.createElement('canvas');
    canvas.height=viewport.height;canvas.width=viewport.width;
    document.getElementById('canvas-wrap').innerHTML='';
    document.getElementById('canvas-wrap').appendChild(canvas);
    page.render({canvasContext:canvas.getContext('2d'),viewport:viewport}).promise.then(function(){
      pageRendering=false;
      if(pageNumPending!==null){renderPage(pageNumPending);pageNumPending=null;}
    });
  });
  document.getElementById('pageInfo').textContent='Page '+num+' of '+pdfDoc.numPages;
  document.getElementById('prev').disabled=(num<=1);
  document.getElementById('next').disabled=(num>=pdfDoc.numPages);
}
function queueRenderPage(num){
  if(pageRendering){pageNumPending=num;}
  else{renderPage(num);}
}
function changePage(offset){
  var n=pageNum+offset;
  if(n<1||n>pdfDoc.numPages)return;
  pageNum=n;queueRenderPage(pageNum);
}
pdfjsLib.getDocument({url:url,withCredentials:true}).promise.then(function(pdf){
  pdfDoc=pdf;renderPage(pageNum);
}).catch(function(err){
  document.getElementById('canvas-wrap').innerHTML='<p id="error">Could not load PDF. Please try again.</p>';
  document.getElementById('pageInfo').textContent='Error';
});
</script></body></html>`;
}

export default function MaterialViewerScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<Params, "MaterialViewer">>();
  const item = route.params?.item;
  const [noteText, setNoteText] = useState<string | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);
  const [pdfStreamUrl, setPdfStreamUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (!item || !isPdfItem(item)) return;
    setLoadingPdf(true);
    getMaterialStreamUrl(item._id)
      .then(setPdfStreamUrl)
      .finally(() => setLoadingPdf(false));
  }, [item]);

  useEffect(() => {
    if (!item || item.type !== "note" || isImageUrl(item.url)) return;
    setLoadingNote(true);
    getMaterialStreamUrl(item._id)
      .then((url) => fetch(url).then((r) => r.text()))
      .then(setNoteText)
      .catch(() => setNoteText(item.description || "Unable to load note."))
      .finally(() => setLoadingNote(false));
  }, [item]);

  if (!item) {
    return (
      <Screen title="Reader">
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>Material not found</Text>
      </Screen>
    );
  }

  const showPdf = isPdfItem(item);
  const showImage = isImageUrl(item.url) && !showPdf;
  const { height } = Dimensions.get("window");

  return (
    <Screen title={item.title}>
      <View style={[styles.meta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.metaType, { color: colors.accent }]}>{item.type.toUpperCase()}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, textTransform: "capitalize" }}>{item.category}</Text>
        {item.description ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.description}</Text> : null}
      </View>

      {showPdf && (
        loadingPdf || !pdfStreamUrl ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <WebView
            source={{ html: pdfHtml(pdfStreamUrl) }}
            style={{ flex: 1, height: height * 0.78, backgroundColor: colors.background }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
          />
        )
      )}

      {showImage && (
        <ScrollView contentContainerStyle={styles.imageWrap}>
          <Image source={{ uri: item.url }} style={styles.image} resizeMode="contain" />
        </ScrollView>
      )}

      {item.type === "video" && (
        <WebView
          source={{ html: `<video src="${item.url}" controls playsinline style="width:100%;height:100%;background:#000"></video>` }}
          style={{ flex: 1, height: height * 0.5 }}
          javaScriptEnabled
        />
      )}

      {item.type === "audio" && (
        <View style={[styles.audioWrap, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="mic" size={48} color={colors.primary} />
          <WebView
            source={{ html: `<audio src="${item.url}" controls style="width:100%"></audio>` }}
            style={{ width: "100%", height: 60, marginTop: 16 }}
            javaScriptEnabled
          />
        </View>
      )}

      {item.type === "note" && !showImage && (
        <ScrollView style={styles.noteScroll}>
          {loadingNote ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24 }}>
              {noteText || item.description || "No content."}
            </Text>
          )}
        </ScrollView>
      )}

      {!showPdf && !showImage && item.type !== "video" && item.type !== "audio" && item.type !== "note" && (
        <View style={styles.fallback}>
          <Ionicons name="open-outline" size={40} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>Preview not available</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  metaType: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  imageWrap: { alignItems: "center", padding: 8 },
  image: { width: "100%", minHeight: 300 },
  audioWrap: { alignItems: "center", padding: 32, borderRadius: 16, marginTop: 20 },
  noteScroll: { flex: 1, padding: 4 },
  fallback: { alignItems: "center", paddingTop: 60 },
});