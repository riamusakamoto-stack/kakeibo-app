export async function onRequestPost(context) {
  try {
    // 1. フロントエンドから送られてきた画像データ（Base64形式）を受け取る
    const data = await context.request.json();
    const base64Image = data.image.split(',')[1];
    const apiKey = context.env.VISION_API_KEY;

    // 2. Google Cloud Vision APIへ送信する設定
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
    const text = result.responses[0]?.fullTextAnnotation?.text || "";

    // 3. 読み取った文字から金額を抽出
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

    // 4. 結果をフロントエンドに返す
    return Response.json({ success: true, text, amount: extractedAmount, date: extractedDate });

  } catch (error) {
    return Response.json({ success: false, error: error.toString() }, { status: 500 });
  }
}