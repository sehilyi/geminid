import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import Editor from './Editor';
import './index.css';
import 'higlass/dist/hglib.css';

ReactDOM.render(
    <BrowserRouter>
        <Route component={Editor} />
    </BrowserRouter>,
    document.getElementById('root') as HTMLElement
);
