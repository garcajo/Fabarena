require('dotenv').config();
const cardController = require('../src/controllers/cardController');

// Mock Req and Res
const req = {};
const res = {
    json: (data) => {
        console.log("Response JSON received.");
        if (Array.isArray(data)) {
            console.log(`Received ${data.length} heroes.`);
            if (data.length > 0) {
                console.log("Sample hero:", data[0]);
            }
        } else {
            console.log("Result:", data);
        }
    },
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return {
            json: (data) => console.log("Error JSON:", data)
        };
    }
};

async function test() {
    console.log("Testing getLivingLegendData...");
    try {
        await cardController.getLivingLegendData(req, res);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
