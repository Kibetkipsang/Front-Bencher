
export const test = async (req: Request, res: Response) => {
   const {email, password} = req.body;
   // check if user exists
   const userExists = await client.user.findUnique({
    where: {email}
   });
   if (userExists){
    return res.status(409).json({
        message: "The email is already associated with an account."
    })
   }
}