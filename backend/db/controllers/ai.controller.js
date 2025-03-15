import * as ai from '../services/ai.service.js';

export const getResult = async (req, res) => {

    try{
        const prompt=req.query.prompt;
        const response=await ai.generateResult(prompt);
        res.send(response);
        }catch(err){
            console.log(err);
            res.status(500).send('An error occurred while fetching the result');
    
    }


}