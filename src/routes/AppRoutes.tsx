import { Routes, Route } from 'react-router-dom';
import MainMenu from '../pages/MainMenu';

const AppRoutes: React.FC = () => {

    return (
        <Routes>
            <Route path="/" element={<MainMenu />} />
        </Routes>
    )

}

export default AppRoutes;