import mongoose from 'mongoose';

const dataSchema = new mongoose.Schema({
    date: Date,
    time: String,
    totalBuyer: String,
    totalSeller: String,
    ir:Number, //instant ratio
    ratio: Number
});

dataSchema.pre('save', async function (next) {
    try {
        // Check if the specificTime field is not already set
        if (!this.time) {
            // Set the time component to the current time (hh:mm)
            const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            this.time = currentTime;
        }

        // Fetch all previous data
        const previousData = await dataModel.find({}).sort({ 'date': 1 });

        // Calculate the sum of totalBuyer and totalSeller for all previous data
        const sumPreviousBuyer = previousData.reduce((acc, data) => acc + parseFloat(data.totalBuyer) || 0, 0);
        const sumPreviousSeller = previousData.reduce((acc, data) => acc + parseFloat(data.totalSeller) || 0, 0);

        // Convert current totalBuyer and totalSeller to numbers and round to two decimal places
        const currentBuyer = parseFloat(this.totalBuyer) || 0;
        const currentSeller = parseFloat(this.totalSeller) || 0;

        // Save rounded values to two decimal places
        this.totalBuyer = currentBuyer.toFixed(2);
        this.totalSeller = currentSeller.toFixed(2);

        // Calculate the ratio by adding up totalBuyer and totalSeller of previous and current data
        this.ratio = ((currentBuyer + sumPreviousBuyer) / (currentSeller + sumPreviousSeller)).toFixed(2);
        this.ir = (currentSeller / currentBuyer).toFixed(2);
        next();
    } catch (error) {
        console.error(error);
        next(error);
    }
});

const dataModel = mongoose.model("optiondata", dataSchema);

export default dataModel;
