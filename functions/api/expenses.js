export async function onRequestGet(context) {
  const db = context.env.DB;
  // idも含めて取得します
  const { results } = await db.prepare('SELECT rowid as id, * FROM expenses ORDER BY date DESC').all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  const data = await context.request.json();
  const { date, amount, category, store_name } = data;
  
  await db.prepare('INSERT INTO expenses (date, amount, category, store_name) VALUES (?, ?, ?, ?)')
    .bind(date, amount, category, store_name)
    .run();
    
  return Response.json({ success: true });
}

export async function onRequestPut(context) {
  const db = context.env.DB;
  const data = await context.request.json();
  const { id, date, amount, category, store_name } = data;
  
  await db.prepare('UPDATE expenses SET date = ?, amount = ?, category = ?, store_name = ? WHERE rowid = ?')
    .bind(date, amount, category, store_name, id)
    .run();
    
  return Response.json({ success: true });
}

export async function onRequestDelete(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  
  if (id) {
    await db.prepare('DELETE FROM expenses WHERE rowid = ?').bind(id).run();
  }
  return Response.json({ success: true });
}