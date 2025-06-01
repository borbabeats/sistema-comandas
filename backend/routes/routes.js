const express = require("express")
const { Plate, Dessert, Beverage } = require('../models/plate'); // Adjust the path as necessary

const router = express.Router()

router.post('/newplate', async (req, res) => {
    const { name, description, price, info } = req.body;
    const plateRepository = AppDataSource.getRepository(Plate);
    const plate = new Plate();
    plate.name = name;
    plate.description = description;
    plate.price = price;
    plate.info = info;
    await plateRepository.save(plate);
    res.status(201).json({ message: "Plate created successfully" });
});

router.post('/newdessert', async (req, res) => {
    const { name, description, price, info } = req.body;
    const dessertRepository = AppDataSource.getRepository(Dessert)
    const dessert = new Dessert();
    dessert.name = name;
    dessert.description = description;
    dessert.price = price;
    dessert.info = info;
    await dessertRepository.save(dessert)
    res.status(201).json({ message: "Dessert created successfully" })
})

router.post('/newbeverage', async (req, res) => {
    const { name, price, info } = req.body;
    const beverageRepository = AppDataSource.getRepository(Beverage)
    const beverage = new Beverage();
    beverage.name = name;
    beverage.price = price;
    beverage.info = info;
    await beverageRepository.save(beverage)
    res.status(201).json({ message: "Beverage created successfully" })
})

router.get('/plates', async (req, res) => {
    const plateRepository = AppDataSource.getRepository(Plate)
    const plates = await plateRepository.find()
    res.status(200).json(plates)
})

router.get('/desserts', async (req, res) => {
    const dessertRepository = AppDataSource.getRepository(Dessert)
    const desserts = await dessertRepository.find()
    res.status(200).json(desserts)
})

router.get('/beverages', async (req, res) => {
    const beverageRepository = AppDataSource.getRepository(Beverage)
    const beverages = await beverageRepository.find()
    res.status(200).json(beverages)
})

router.get('/plate/:id', async (req, res) => {
    const plateRepository = AppDataSource.getRepository(Plate)
    const plate = await plateRepository.findOne({ where: { id: req.params.id } })
    res.status(200).json(plate)
})

router.get('/dessert/:id', async (req, res) => {
    const dessertRepository = AppDataSource.getRepository(Dessert)
    const dessert = await dessertRepository.findOne({ where: { id: req.params.id } })
    res.status(200).json(dessert)
})

router.get('/beverage/:id', async (req, res) => {
    const beverageRepository = AppDataSource.getRepository(Beverage)
    const beverage = await beverageRepository.findOne({ where: { id: req.params.id } })
    res.status(200).json(beverage)
})


router.get("/", (req, res) => {
    res.send("Hello World")
})


module.exports = router