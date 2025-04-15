const express = require('express');
const fetch = require('node-fetch');  // 添加这行
const app = express();

// 环境变量配置
const FOLO_SECRET = process.env.FOLO_SECRET;
const FOLO_HANDLE = process.env.FOLO_HANDLE;
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(express.json());

app.post('/api/webhook', async (req, res) => {
    try {
        // 验证请求体是否存在
        if (!req.body || !req.body.data) {
            console.error('无效的请求体');
            return res.status(400).json({ error: '无效的请求体' });
        }

        const tweetData = req.body.data;
        
        // 构建发送到Folo的数据
        const foloPayload = {
            guid: `twitter-${tweetData.id_str}`,
            publishedAt: tweetData.tweet_created_at,
            title: `${tweetData.user.name} on Twitter`,
            content: tweetData.full_text || tweetData.text,
            author: tweetData.user.name
        };

        console.log('准备发送到Folo的数据:', JSON.stringify(foloPayload, null, 2));

        // 发送到Folo API
        const foloResponse = await fetch('https://api.follow.is/inboxes/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Follow-Secret': FOLO_SECRET,
                'X-Follow-Handle': FOLO_HANDLE
            },
            body: JSON.stringify(foloPayload)
        });

        if (!foloResponse.ok) {
            const errorText = await foloResponse.text();
            console.error('Folo API错误:', errorText);
            throw new Error(`Folo API错误: ${foloResponse.status} - ${errorText}`);
        }

        const responseData = await foloResponse.json();
        console.log('Folo响应:', responseData);

        res.status(200).json({ status: 'success', data: responseData });

    } catch (error) {
        console.error('处理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Vercel 需要导出 app
module.exports = app;

// 本地开发时使用
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
    });
}
