import React, { useState } from 'react'
// import './Inputdata.scss'
import Button from "@mui/material/Button";
const InputData = ({handleClose}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const handleInputChange = (event) => {
      setInputValue(event.target.value);
      setError('');

    };

    const onSubmitPin = () => {
        if (!inputValue.trim()) {
            setError('Please enter a pin');
            return;
          }
    }
  return (
    <div className="text-field-container">
        <input
            type="text"
            value={inputValue} 
            onChange={handleInputChange}
            placeholder="Enter PIN"
        />
            <center>
                {error && <span style={{ color: 'red' }}>{error}</span>}
            </center>
            
            <center><Button variant="contained" sx={{marginTop:"20px"}} onClick={() =>
            {  onSubmitPin()
             handleClose()
              console.log(inputValue)}}
                >Enter</Button>
            </center> 
    </div> 
  )
}

export default InputData
