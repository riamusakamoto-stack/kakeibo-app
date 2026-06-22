export async function onRequestGet(context) {
  // データベースからすべての家計簿データを取得する処理
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  // 画面から送られてきたデータをデータベースに保存する処理
  const db = context.env.DB;
  const data = await context.request.json();
  const { date, amount, category, store_name } = data;
  
  await db.prepare('INSERT INTO expenses (date, amount, category, store_name) VALUES (?, ?, ?, ?)')
    .bind(date, amount, category, store_name)
    .run();
    
  return Response.json({ success: true });
}