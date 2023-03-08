import React, { useEffect, useState } from 'react'
import '../assets/Purchase.css'
import { useHistory } from 'react-router-dom'
import { InputGroup, FormControl } from 'react-bootstrap'
import { NFTStorage } from 'nft.storage'

import { Certificate, download, certificateImage } from './certificate.js';
import { getUser, getMarriageProposalById, respondToMarriageProposal, mintMarriageCertificate } from "./services/web3";
import { GENDER } from './services/constants';
import { dataURItoBlob } from './services/utility';

function AcceptMarriageProposal(props) {
    
    const { goBack } = useHistory()
    const proposalId = props.match.params.marriageProposalId;

    const [proposalDetails, setProposalDetails] = useState({
        proposalId: "",
        proposerAddr: "",
        proposerUser: "",
        proposerVows: "",
        proposalStatus: "0",
    })
    const [isDisabled, setIsDisabled] = useState(false);
    const [currUser, setCurrUser] = useState({});
    const [yourVows, setYourVows] = useState(""); 

    useEffect(() => {
        const fetchData = async () => {
            const currUser = await getUser(); // Current user
            setCurrUser(currUser);

            const proposal = await getMarriageProposalById(proposalId);

            const user = await getUser(proposal.proposer);
            setProposalDetails(prevData => ({
                ...prevData,
                proposalId: proposal.id,
                proposerAddr: proposal.proposer,
                proposerUser: user,
                proposerVows: proposal.proposerVows,
                proposalStatus: proposal.status,
            }));

            if(proposal.status === "1") {
                setIsDisabled(true);
                setYourVows(proposal.proposeeVows);
            }
            else if(proposal.status === "2") {
                setIsDisabled(true);
            }

          };

        fetchData();
    },[proposalId]);

    const respondToProposal = async (response) => {
        const status = await respondToMarriageProposal(proposalId, response, yourVows);
        if(status) {
            window.alert("Your response is saved on blockchain successfully");
            window.location.reload();
        }
    }

    const mint = async () => {
        const imageb64png = certificateImage();
        const image = dataURItoBlob(imageb64png)

        const client = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE })
        const ipfs = { 
            name: "Marriage certificate",
            description: "This is a marriage certificate",
            image: image,
            proposer: proposalDetails.proposerUser.name , 
            proposee: currUser.name,  
        };
        const metadata = await client.store(ipfs);
        window.alert("Successfully stored on IPFS");

        var storageUrl = metadata.url;
        const status = await mintMarriageCertificate(storageUrl, proposalDetails.proposerAddr);
        if(status) {
            window.alert('Minted marriage certificate successfully for you and your partner!');
            window.location.href ="/#/dashboard"
        }
    }

    return(
            <div className='purchase'>
                <div className="goback">    
                   <img style={{width:"48px"}} src="/assets/images/wedding-img/icon/left-arrow3.png" onClick={goBack} alt="Go back" className='gobackButton'/>   
                </div> 
                <br/><br/><br/>
                <div className="purchase__artwork">
                    <Certificate style={{width:"35vw"}} width='700' height='500' 
                    groom_name={proposalDetails.proposerUser.name} bride_name={currUser.name}
                    groom_vows={proposalDetails.proposerVows} bride_vows={yourVows} is_proposal='false'/>
                    <br/>
                    <button className="btn btn-primary" onClick={() => {download();} }><i className="mdi mdi-file-check btn-icon-prepend"></i>Download</button>
                </div>

                <div className="purchase__details">
                <h3 style={{fontFamily:"Poppins, serif", color:"#f2c96a"}}>Proposer's Details:</h3>
                    <div className='d-flex' style={{fontWeight:"300"}}>
                    <h4 style={{marginRight:"1rem",fontWeight:"300"}}>Name: <span style={{color:"#f2c96a"}}>{proposalDetails.proposerUser.name}</span></h4> 
                    <h4 style={{fontWeight:"300"}}>Gender: <span style={{color:"#f2c96a"}}>{GENDER[proposalDetails.proposerUser.gender]}</span></h4> 

                    </div>
                    <h4 style={{width:"250px", overflow:"hidden", whiteSpace:"nowrap", cursor:"pointer", textOverflow:"ellipsis", fontWeight:"300"}} 
                    onClick={(e) => {navigator.clipboard.writeText(proposalDetails.proposerAddr); alert("Copied wallet address to clipboard")}}>
                        Wallet Address: <span style={{color:"#f2c96a"}}>{proposalDetails.proposerAddr}</span></h4>
                    <label>Recieved Vows:</label>
                    <textarea style={{color:"#f2c96a",background:"#2A3038"}} className="form-control" id="exampleTextarea1" rows="4" 
                        value={proposalDetails.proposerVows} disabled />
                    <br/>  

                    <label className="mt-4">Your Vows:</label>
                    <textarea style={{color:"#f2c96a"}} value={yourVows} onChange={(e) => {setYourVows(e.target.value)}}
                        className="form-control" id="note" rows="4" placeholder="Write your vows"/>

                        {
                            isDisabled ? 
                            <div>
                                {proposalDetails.proposalStatus === "1" && <button type="button" className="btn btn-success">Accepted</button>}
                                {proposalDetails.proposalStatus === "2" && <button type="button" className="btn btn-danger">Rejected</button>}
                                <div  style={{marginTop:"10px"}} className="purchase__detailsBuy" >
                                <button onClick={mint}>Mint Marriage Certificate</button>
                                </div>
                            </div>
                            :
                            <div style={{marginTop:"10px"}} className="purchase__detailsBuy">
                                <button style={{background: "radial-gradient( circle 542px at 16.6% 38.6%,  rgba(66,164,14,1) 0%, rgba(86,230,99,1) 100.2% )"}} onClick={() => {respondToProposal(true)}}>Accept Proposal</button>
                                <button onClick={() => {respondToProposal(false)}} 
                                style={{background: "linear-gradient(to right, #ee0979, #ff6a00)"}} >Reject Proposal</button>
                            </div>
                        }
                    
                </div>
            </div> 
    )
}

export default AcceptMarriageProposal;
