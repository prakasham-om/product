import express from 'express';
import cors from 'cors';
import axios from 'axios';
import databaseConnect from './db/dataBase.js';
import dataModel from './model/dataModel.js';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname,join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


dotenv.config();

const app = express();

app.use(express.json());
// app.use(cors({ origin: ["https://deploy-mern-1whq.vercel.app"],
//                 methods: ["GET", "POST"],
//                 credentials:true,
// }));

app.use(cors({origin:"*"}))

databaseConnect();

app.get('/',(req,res)=>{
    res.json({message:"hello"})
})
app.get('/getdata', async (req, res) => {
    try {
        const data = await dataModel.find();
        res.status(200).json(data);
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
});

app.get('/banknifty', async (req, res) => {
    try {
        const apiUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY`;
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'application/json',
            },
        });

        const optionChainData = response.data.filtered.data || [];
       return res.status(200).json(optionChainData);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Error getting banknifty Api" });
    }
});

// Post data to MongoDB (totalBuyer, totalSeller)
app.post('/', async (req, res) => {
    try {
        const date = new Date().toLocaleDateString();
        const { totalBuyer, totalSeller } = req.body;

        if (totalBuyer === 0 && totalSeller === 0 || totalBuyer === null && totalSeller === null) {
            return res.json({ message: "Empty Data" });
        }

        const data = new dataModel({ date, totalBuyer, totalSeller });
        await data.save();

        return res.status(200).json({ message: "Data save successful" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server code error" });
    }
});

// Schedule task to run every day at 8:25 pm
cron.schedule('40 15 * * *', async () => {
    try {
        const data = await dataModel.find();
         

        const totalBull = data.reduce((ele, item) => ele + parseFloat(item.totalBuyer), 0);
        const totalBear = data.reduce((ele, item) => ele + parseFloat(item.totalSeller), 0);


        const currentDate = new Date();
        const options = { day: '2-digit', month: '2-digit', year: '2-digit' };
        const formattedDate = currentDate.toLocaleDateString('en-GB', options);
        // Use EJS template to create HTML content
        const template = `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
    
                h1 {
                    color: #333;
                    text-align: center;
                }
    
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    border: 1px solid #333;
                }
    
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: center;
                }
    
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h1>Data Report</h1>
             <h1>${formattedDate}</h1>
             <p>Total Bull : &nbsp:${totalBull}</P>
             <p>Total Bear : &nbsp:${totalBear}</P>
            <table>
                <tr>
                    <th>Time</th>
                    <th>Total Buyer</th>
                    <th>Total Seller</th>
                    <th>Inst Ratio</th>
                    <th>Ratio</th>
                </tr>
                <% data.forEach(item => { %>
                    <tr>
                        <td><%= item.time %></td>
                        <td><%= item.totalBuyer %></td>
                        <td><%= item.totalSeller %></td>
                        <td style="color: <%= item.ir > 1 ? 'red' : 'green' %>;" ><%= item.ir %></td>
                        <td style="color: <%= item.ratio > 1 ? 'red' : 'green' %>;" ><%= item.ratio %></td>
                     </tr>

                <% }); %>

                
            </table>
        
        </body>
    </html>
    
        `;

        const htmlContent = ejs.render(template, { data });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        
        const pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close();

        // Send email with the attached PDF
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const userEmailAddress = process.env.USER_EMAIL;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmailAddress,
            subject: 'Daily Report',
            text: 'Please find the attached daily report.',
            attachments: [{
                filename: 'report.pdf',
                content: pdfBuffer,
                encoding: 'base64'
            }],
            html: `<p>Please find the attached daily report.</p>`
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
            if (emailErr) {
                console.error(emailErr);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    } catch (error) {
        console.error(error);
    }
});


//this method is clear data every data 

// cron.schedule('0 21 * * *', async () => {
//     try {
//         // Clear all data from the MongoDB collection
//         await dataModel.deleteMany({});
//         console.log('Data cleared successfully');
//     } catch (error) {
//         console.error(error);
//     }
// });

app.use(express.static(join(__dirname, '../my-app/dist')));
app.get('*',(req,res)=>{
    res.sendFile(join(__dirname, '../my-app/dist/index.html'))
})


app.listen(process.env.SERVER_PORT, (err) => {
    if (err) throw err;
    else {
        console.log("server start");
    }
});
