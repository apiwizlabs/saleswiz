import React, { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate, Navigate } from "react-router";
import jwt_decode from "jwt-decode";
import ApiwizLogo from "../assets/apiwiz-logo.png";
import useOutsideClick from "../utils/useOutsideClick";
import LogoutIcon from "../assets/icons/logout-icon.svg";
import SideModal from "./Modals/SideModal";
import { Loader } from "./Loader";
import { ContactsAPI, DealsAPI, LeadsAPI, NotificationsAPI } from "../api/apiConfig";
import { toast } from "react-toastify";

const PrivateRoutes = ({ allowedRoles }) => {
  const tokenValue = localStorage.getItem("wizforce-token");
  let auth =
    !tokenValue || tokenValue == "undefined" ? {} : { token: tokenValue };
  const navigate = useNavigate();
  const location = useLocation();
  const userInitState = {
    userRole: "",
    userId: "",
  };
  const [currentUser, setCurrentUser] = useState(userInitState);
  const isNotExpired =
    auth?.token && jwt_decode(tokenValue).exp * 1000 > Date.now();
  const decoded = auth?.token && jwt_decode(auth.token);
  const [activePage, setActivePage] = useState(location.pathname);
  const [notification, setNotification] = useState({
    show: false,
    loading: false,
    data: [],
  });
  const [activeSearchType, setActiveSearchType] = useState("Deals");
  const [searchingToggle, setSearchingToggle] = useState(false);
  const searchTypes = ["Deals", "Contacts", "Customers"];
  const searchTypeRef = useRef(null)
  const searchingFocus = useRef(null)


  const handleLogout = () => {
    localStorage.removeItem("wizforce-token");
    setCurrentUser(userInitState);
    navigate("/login");
  };

  useEffect(() => {
    setActivePage(location.pathname);
  }, [location.pathname]);

  const getNotifications = () => {
    NotificationsAPI.getAllNotifications()
      .then((res) => {
        console.log("res:", res);
        let data = res?.data?.data || {};
        let notifications = data?.notifications || [];
        setNotification(prev => ({
          ...prev,
          loading: false,
          data: notifications,
        }));
      })
      .catch((err) => {
        console.log("err:", err);
      });
  }

  const clearAllNotifications = async () => {
    try{
      await NotificationsAPI.deleteAllNotifications()
      getNotifications()
    }catch(err){
      console.log("err:", err);
    }
  }

  useEffect(() => {
    if (auth?.token && isNotExpired) {
      const decoded = auth.token && jwt_decode(auth.token);
      setCurrentUser({ userRole: decoded.role, userId: decoded.userId });
      getNotifications()
      
      // if(decoded.role !== "ADMIN"){
      //     console.log("Fetch user details")
      // (async ()=>{
      //     const userDetails = await EngineeringAPI.getUserByEmail(decoded.email)
      //     if(userDetails.status === 200 && userDetails.data.data){
      //         setUserName(userDetails.data.data.name)
      //     }
      // })()
      // }
    } else {
      navigate("/login");
    }
  }, []);

  const sideBarData = [
    {
      title: "Pipeline",
      iconName: "ri-shake-hands-fill",
      route: "/",
    },
    {
      title: "Leads",
      iconName: "ri-building-4-fill",
      route: "/leads",
    },
    {
      title: "Contacts",
      iconName: "ri-contacts-book-2-fill",
      route: "/contacts",
    },
    {
      title: "My Activities",
      iconName: "ri-calendar-check-fill",
      route: "/activities",
    },
  ];

  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [toggleActivities, setToggleActivities] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResultsList, setSearchResultsList] = useState([]);

  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, () => {
    setToggleDropdown(false);
  });
  useOutsideClick(searchTypeRef, () => {
    setToggleActivities(false);
  });

  useOutsideClick(searchingFocus, () => {
    console.log("im in outside clic")
    setSearchInput("");
    setSearchingToggle(false)
  });

  const openNotification = () => {
    let _notification = {
      ...notification,
      show: true,
      loading: true,
      data: [],
    };
    setNotification(_notification);
    NotificationsAPI.getAllNotifications()
      .then((res) => {
        console.log("res:", res);
        let data = res?.data?.data || {};
        let notifications = data?.notifications || [];
        setNotification({
          ..._notification,
          loading: false,
          data: notifications,
        });
      })
      .catch((err) => {
        console.log("err:", err);
        setNotification({ ..._notification, loading: false });
      });
  };

  const getIconType = (type) => {
    //["TASK","CALL","TEAM","DEAL","CUSTOMER","CONTACT","ACTIVITY", "APPROVAL"]
    if (type === "TASK") return "ri-check-double-line";
    if (type === "CALL") return "ri-customer-service-line";
    if (type === "TEAM") return "ri-team-line";
    if (type === "DEAL") return "ri-briefcase-5-line";
    if(type === "CUSTOMER") return "ri-user-follow-line";
    if(type === "CONTACT") return "ri-account-box-line";
    if (type === "APPROVAL") return "ri-auction-line";
    return "ri-refresh-line";
  };

  const deleteNotification = ({ id }) => {
    NotificationsAPI.deleteNotificationById({ id })
      .then((res) => {
        toast.success("Notification deleted successfully!");
        let _list = notification.data.filter((x) => x._id !== id);
        setNotification({ ...notification, data: _list });
      })
      .catch((err) => {
        // throwServerError(err);
        console.log("[deleteNotification] err:", err);
      });
  };

  const handleSearchChange = async () => {
    try{
      if(activeSearchType === "Deals"){
        const deals = await DealsAPI.getAllDeals({queries: {searchInput: searchInput}});
        console.log("RESS SEARCH",deals);
        setSearchResultsList(deals?.data?.data);
      }
      if(activeSearchType === "Contacts"){
        const deals = await ContactsAPI.getAllContacts({queries: {searchInput: searchInput}});
        console.log("RESS SEARCH",deals);
        setSearchResultsList(deals?.data?.data);
      }
      if(activeSearchType === "Customers"){
        const deals = await LeadsAPI.getAllCustomers({queries: {searchInput: searchInput}});
        console.log("RESS SEARCH",deals);
        setSearchResultsList(deals?.data?.data);
      }
    }catch(err){
      console.log(err)
    }
  }

  const Notification = ({ notification }) => {
    return (
      <div className="app-notification d-flex align-items-center justify-content-between px-20px py-18px gap-10px">
        <div className="d-flex align-items-center gap-6px">
          <div>
            <i className={getIconType(notification.type)} />
          </div>
          <div className="fs-12px fw-500">{notification.description}</div>
        </div>
        <div
          onClick={() => deleteNotification({ id: notification._id })}
          className="cursor app-notification-delete"
        >
          <i className="ri-delete-bin-5-line color-error-red"></i>
        </div>
      </div>
    );
  };

  useEffect(()=>{
    handleSearchChange();
  },[searchInput])



  return auth.token && isNotExpired ? (
    // auth.token && isNotExpired && allowedRoles.includes(decoded.role) ?
    <div className="w-100 h-100vh parent-grid">
      <div className="d-flex w-100 h-64px bg-dark-primary align-items-center px-24px justify-content-between position-fixed zIndex-200">
        <div className="d-flex align-items-center w-100">
          <img alt="Wizforce Logo" src={ApiwizLogo} className="w-48px h-48px" />
          <div ref={searchingFocus} className="w-100 position-relative mr-75px">
            <div className={`d-flex ${searchingToggle ? 'w-100' : 'w-316px'} ml-40px`}>
              <div 
              onClick={()=>{
                console.log("12 im runningg");
                setSearchInput("")
              }}  
              className="position-relative">
                <div onClick={()=>setToggleActivities(prev => !prev)} className={`${searchingToggle ? 'first-div-search-active' : 'first-div-search color-grey-50'} d-flex align-items-center cursor`}>
                  {activeSearchType}
                  <i class="ri-arrow-down-s-fill"></i>
                </div>
                {toggleActivities && 
                <div    
                ref={searchTypeRef}
                className="position-absolute dropdown-activities d-flex flex-column gap-10px br-4px">
                  {searchTypes.map(type => {
                  if(type !== activeSearchType){
                    return (<p onClick={()=>{
                      setToggleActivities(false)
                      setActiveSearchType(type)}} className="activities-items">{type}</p>)
                  }
                  return null;
                  } )}
                </div>}
              </div>
            
              {searchingToggle ? 
              <div 
              // ref={searchingFocus} 
              className="position-relative w-100">
                <i style={{top: "4px", left: "8px"}} className="ri-search-line mr-10px position-absolute"></i>
                <input autoFocus={true} 
                value={searchInput}
                onChange={(e)=>setSearchInput(e.target.value)} onClick={()=>setSearchingToggle(true)} 
                placeholder="Search..." 
                className="second-div-search-active w-100 h-33px g-10px align-items-center pl-30px" />
              </div>
              : <div onClick={()=>setSearchingToggle(true)} className="second-div-search color-grey-50 w-218px h-33px g-10px align-items-center">
                  <i className="ri-search-line mr-10px"></i>
                  <p>Search....</p>
              </div>}
            </div>
            {searchingToggle && searchInput && 
            <div 
            // ref={searchingFocus} 
            onClick={()=>setSearchingToggle(true)} className="position-absolute search-res-dd">
              <div className="d-flex flex-column gap-8px">
                {searchResultsList?.length > 0 ? 
                searchResultsList.map(item => {
                  console.log("ITEM 11::",item)
                  if(activeSearchType==="Deals"){
                    return(
                      <div onClick={(e)=>{
                        navigate(`/deals/${item._id}`)
                        setSearchingToggle(false);
                        setSearchInput("");
                        e.stopPropagation()
                      }} className="search-res-item ">
                         <p className="fw-500 fs-14px color-grey-700">{item?.userValues?.find(userValue => userValue?.labelName === "Deal Name")?.fieldValue}</p>
                      </div>
                    )
                  }else if(activeSearchType==="Contacts"){
                    return(
                      <div onClick={(e)=>{
                        setSearchingToggle(false)
                        navigate(`/contacts/${item._id}`)
                        e.stopPropagation()
                      }} className="search-res-item">
                         <p className="fw-500 fs-14px color-grey-700">{item?.userValues?.find(userValue => userValue?.labelName === "Contact Name")?.fieldValue}</p>
                      </div>
                    )
                  }
                  else if(activeSearchType==="Customers"){
                    return(
                      <div onClick={(e)=>{
                        setSearchingToggle(false)
                        navigate(`/leads/${item._id}`);
                        e.stopPropagation()
                        }} className="search-res-item">
                         <p className="fw-500 fs-14px color-grey-700">{item?.userValues?.find(userValue => userValue?.labelName === "Customer Name")?.fieldValue}</p>
                      </div>
                    )
                  }
                }) : <p>No Results Found</p>}
              </div>
            </div>}
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-20px">
        {/* notification.data */}
          <div className="position-relative">
            {notification?.data?.length > 0 && 
            <div style={{top: "-5px", right: "-5px"}} className="position-absolute notification-badge">
              {`${notification?.data?.length > 99 ? "99+" : notification?.data?.length}`}</div>}
          <i
            onClick={openNotification}
            className="ri-notification-2-line color-white fs-24px cursor lh-24px"
          ></i>
          </div>
         
          <i
            onClick={() => {
              navigate("/teams");
            }}
            className="ri-settings-3-line color-white fs-24px cursor lh-24px"
          ></i>
          <div
            onClick={() => {
              setToggleDropdown(true);
            }}
            className="position-relative w-32px h-32px navicon-bg cursor ml-5px"
          >
            <i className="ri-user-line fs-20px lh-20px color-white absolute-center"></i>
            {toggleDropdown && (
              <div
                ref={dropdownRef}
                className="position-absolute profile-dd d-flex flex-column w-243px px-6px py-4px bg-white"
              >
                <p
                  className="color-grey-900 fw-500 lh-24px fs-16px px-8px py-10px cursor"
                  onClick={() => {
                    setToggleDropdown(false);
                    navigate("/profile");
                    
                  }}
                >
                  Profile Settings
                </p>
                <p
                  onClick={() => {
                    setToggleDropdown(false);
                    handleLogout();
                  }}
                  className="fw-500 lh-24px cursor fs-16px color-error-red px-8px py-10px d-flex align-items-center"
                >
                  Log Out{" "}
                  <img
                    src={LogoutIcon}
                    width="20px"
                    height="20px"
                    className="ml-8px"
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {searchingToggle && <div className="black-mask"></div>}

      <div className=" d-flex flex-column w-97px mt-64px h-100 bg-dark-primary align-items-center pt-16px position-fixed grid-col-1 zIndex-50">
        {sideBarData.map((sidebarItem) => {
          return (
            <div
              className={` ${
                activePage === sidebarItem.route
                  ? "active sidebar-fc-white"
                  : ""
              } sidebar-item d-flex flex-column cursor column-gap-2px justify-content-center align-items-center sidebar-fc-grey mb-12px p-8px w-89px`}
              onClick={() => {
                console.log("Sidebar item clicked");
                // setActivePage(sidebarItem.route)
                navigate(sidebarItem.route);
              }}
            >
              <i
                className={sidebarItem.iconName + " fs-32px d-block mb-2px"}
              ></i>
              <p className="fs-14px text-center">{sidebarItem.title}</p>
            </div>
          );
        })}
      </div>
      <div className="main-body w-100 h-100 grid-col-2">
        <Outlet context={[currentUser, setCurrentUser]} />
      </div>
      {notification.show && (
        <SideModal
          hideSubmitBtn
          heading="Notifications"
          type={"NOTIFICATIONS"}
          syncNotifs={getNotifications}
          deleteAllNotifs={clearAllNotifications}
          onClose={() => {
            setNotification({ ...notification, show: false, loading: false });
          }}
        >
          {notification.loading ? (
            <Loader />
          ) : !notification.data.length ? (
            <div className="d-flex h-100 w-100 justify-content-center align-items-center">
              No notifications available
            </div>
          ) : (
            notification.data.map((el) => <Notification notification={el} />)
          )}
        </SideModal>
      )}
    </div>
  ) : (
    <Navigate to="/unauthorised" />
  );
};

export default PrivateRoutes;
