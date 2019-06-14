import * as express from "express";
import * as bodyParser from "body-parser";

import { StyleRoutes } from "./routes";

class App {
    public app: express.Application;
    public styleRoutes: StyleRoutes = new StyleRoutes();

    constructor() {
        this.app = express();
        this.config();
        this.styleRoutes.routes(this.app);
    }

    private config(): void {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
            next();
        });
    }
}

export default new App().app;