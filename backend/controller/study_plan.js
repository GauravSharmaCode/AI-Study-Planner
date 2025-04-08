import {createPlan, getAllPlans, getPlanById, updatePlanById, deletePlanById} from "../services/study_plan_services.js";
import logger from "../utils/logger.js";

// Controller function to create a new study plan
const createPlan = async (req, res) => {
  try {
    const plan = req.body;
    const newPlan = await createPlan(plan);
    logger.info("Plan generated", { plan: newPlan });
    res.status(201).json(newPlan);
  } catch (error) {
    logger.error("Failed to generate plan:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Controller function to get all study plans
const getAllPlans = async (req, res) => {
  try {
    const plans = await getAllPlans();
    res.status(200).json(plans);
  } catch (error) {
    logger.error("Failed to fetch study plans:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Controller function to get a study plan by ID
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);
    if (plan) {
      res.status(200).json(plan);
    } else {
      res.status(404).send("Plan not found");
    }
  } catch (error) {
    logger.error("Failed to fetch study plan:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Controller function to update a study plan by ID
const updatePlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPlan = req.body;
        if (!updatedPlan) {
            return res.status(400).json({ message: "Request body is required" });
        } else {
            const plan = await updatePlanById(id, updatedPlan);
            res.status(200).json(plan);
        }
    } catch (error) {
        logger.error("Failed to update study plan:", error);
        res.status(500).send("Internal Server Error");
    }
};


const deletePlanById = async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await deletePlanById(id);
        if (plan) {
            res.status(200).json(plan);
        } else {
            res.status(404).send("Plan not found");
        }
    } catch (error) {
        logger.error("Failed to delete study plan:", error);
        res.status(500).send("Internal Server Error");
    }
};


export default { createPlan, getAllPlans, getPlanById, updatePlanById, deletePlanById };