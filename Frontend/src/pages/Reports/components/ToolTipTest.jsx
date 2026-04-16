import ToolTip from "./ToolTip";
import poorImg from '../../../assets/images/poor.png'

function ToolTipTest(){
    return(
        <ToolTip
            imgSrc = {poorImg}
            imgTitle ="poor"
            imgDesc ="jflajflajflafjlajflajflajflaj"
        />
    )
}

export default ToolTipTest;