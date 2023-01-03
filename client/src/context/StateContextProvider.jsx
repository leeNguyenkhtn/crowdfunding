import React, { useContext, createContext } from 'react';

import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  
  const smartContractAddress = '0x2c13355C73e4d4E30720759D507De3146c702476';

  const { contract } = useContract(smartContractAddress);
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

  const address = useAddress();
  const connect = useMetamask();

  const parseCampaignToJson = (campaigns) => {
    const parsedCampaigns = campaigns.map((campaign,i)=>({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i,
    }))
    return parsedCampaigns;
  };

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign([
        address,
        form.title,
        form.description,
        form.target,
        new Date(form.deadline).getTime(),
        form.image,
      ]);
      console.log("contract call successful", data);
    } catch (error) {
      console.log("contract call failed", error);
    }

  }

  const getCampaigns = async()=>{
    const campaigns = await contract.call('getCampaigns');
    const parsedCampaigns = parseCampaignToJson(campaigns);
    return parsedCampaigns;
  }

  const getUserCampaigns = async()=>{
    const allCampaigns = await contract.call('getCampaigns');
    const userCampaigns = allCampaigns.filter((campaign)=>campaign.owner===address);
    const parsedCampaigns = parseCampaignToJson(userCampaigns);
    return parsedCampaigns;
  }

  const getDonations = async(pId)=>{
    const donations = await contract.call('getDonators',pId);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];
    for(let i = 0; i<numberOfDonations; i++){
      parsedDonations.push({
        donator: donations[0][i],
        donations: ethers.utils.formatEther(donations[1][i]),
      });
    }
    return parsedDonations;
  }


  const donate = async(pId, amount)=>{
    const donateToCampaign = await contract.call('donateToCampaign',pId, {value:ethers.utils.parseEther(amount)});

    return donateToCampaign;
  }


  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        getDonations,
        donate,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export const useStateContext = () => useContext(StateContext);

