export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const base64Image = data.image.split(',')[1];
    const apiKey = context.env.VISION_API_KEY;

    // APIキーがCloudflareに正しく設定されているかチェック
    if (!apiKey) {
      return Response.json({ success: false, error: "CloudflareにAPIキーが設定されていません（環境変数 VISION_API_KEY を確認してください）。" }, { status: 500 });
    }

    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const requestBody = {
      requests: [{
        image: { content: base64Image },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
      }]
    };

    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    // ★追加：Googleからエラーが返ってきていないかチェック
    if (result.error) {
      return Response.json({ success: false, error: `Google APIエラー: ${result.error.message}` }, { status: 500 });
    }

    // ★追加：文字が一つも検出されなかった場合のチェック
    if (!result.responses || !result.responses[0] || Object.keys(result.responses[0]).length === 0) {
      return Response.json({ success: false, error: "画像から文字が検出されませんでした。" }, { status: 500 });
    }

    const text = result.responses[0].fullTextAnnotation?.text || "";

    let extractedAmount = '';
    const amountMatch = text.match(/(?:合計|¥|￥|合\s*計)\s*([0-9,]+)/);
    if (amountMatch) {
      extractedAmount = amountMatch[1].replace(/,/g, '');
    } else {
      const numbers = text.match(/\b[1-9]\d{2,5}\b/g); 
      if (numbers) extractedAmount = Math.max(...numbers.map(Number)).toString();
    }

    const today = new Date();
    let extractedDate = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;

    return Response.json({ success: true, text, amount: extractedAmount, date: extractedDate });

  } catch (error) {
    return Response.json({ success: false, error: error.toString() }, { status: 500 });
  }
}