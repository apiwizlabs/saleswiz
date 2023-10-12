import React, { useState, useRef, useEffect } from 'react';
import TimelineDotTicked from "../../../assets/timelinedot.svg";
import TimelineDot from "../../../assets/timelinedot2.svg";
import { Tooltip } from 'react-tooltip';

const HorizontalTimeline = ({ stages, currentStage }) => {
  // Calculate the distance between dots based on the number of entries
  const [dotSpacing, setDotSpacing] = useState(`calc(100% / ${stages.length - 1})`);

  // Create an array to store the dots
  const dots = [];

  const indexOfStage = stages.indexOf(currentStage);
  const [pillWidth, setPillWidth] = useState('50px');
  const ref = useRef(null);
  useEffect(() => {
    if(ref.current){
        setPillWidth(ref.current.offsetWidth);
        if(indexOfStage === stages.length - 1){
          console.log(ref.current.offsetWidth, "currrr");
          //  setDotSpacing(`calc((100% - ${ref.current.offsetWidth}px) / ${stages.length - 1})`)
          //temporary fix
           setDotSpacing(`calc(80% / ${stages.length - 1})`)
        }
    }
  }, [ref.current]);

{console.log(dotSpacing, "DOTS SPACINGGG ", indexOfStage === stages?.length - 1 )}





  // Generate the dots
  for (let i = 0; i < stages.length; i++) {

    if(i < indexOfStage){
        dots.push(
            <img data-tooltip-id="my-tooltip1" data-tooltip-content={`${stages[i]}`}  key={i} className="timeline-dot" src={TimelineDotTicked}  />
          );
        dots.push(
            <div style={{width: dotSpacing}} className='purple-line'></div>
          );
    }
    else if(i === indexOfStage){
      if(indexOfStage === stages.length -1){
        dots.push(
          <div ref={ref}
          style={{
              right: "-70px",
              width: "max-content"
            }}
          // style={{left: `calc(((100% / ${stages.length}) * ${i}) - ${pillWidth / 2})`}} 
          className='current-stage-pill position-absolute'>
            <i class="ri-ball-pen-line"></i>{currentStage}
          </div>
        );

      }else{
        dots.push(
          // <div ref={ref}
          // style={{
          //     left: `calc(((100% / ${stages.length - 1}) * ${i}) - (${pillWidth / 2}px))`,
          //   }}
          // // style={{left: `calc(((100% / ${stages.length}) * ${i}) - ${pillWidth / 2})`}} 
          // className='current-stage-pill position-absolute'><i class="ri-ball-pen-line"></i>{currentStage}</div>
          <div
            ref={ref}
            style={ {
              left: `calc(((100% / ${stages.length - 1}) * ${i}) - (${pillWidth / 2}px))`,
              maxWidth: "170px"
            }}
            className='current-stage-pill position-absolute'
          >
            {/* <i className="ri-ball-pen-line"></i> */}
            <i className='ri-arrow-right-double-line'></i>
            <p style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
              {currentStage}
            </p>
          </div>

        );
      }
        

          if(i !== stages.length - 1 ){
            dots.push(
                <div style={{width: dotSpacing}} className='grey-line'></div>
              );
          }

    }else if(i > indexOfStage){
        dots.push(
            <img data-tooltip-id="my-tooltip1" data-tooltip-content={`${stages[i]}`} key={i} className="timeline-dot" src={TimelineDot} />
          );
          if(i !== stages.length - 1 ){
            dots.push(
                <div style={{width: dotSpacing}} className='grey-line'></div>
              );
          }
        
    }

 
  }

  return (
    <div className="d-flex w-100 align-items-center position-relative">
      <Tooltip style={{ backgroundColor: "white", color: "black" }} id="my-tooltip1"  place={"bottom"} />
      {dots}
    </div>
  );
};

export default HorizontalTimeline;
